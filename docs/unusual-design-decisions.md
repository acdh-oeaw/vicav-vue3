# Unusual Design Decisions

A catalogue of the architectural and implementation choices in this repository that deviate from
common Nuxt/Vue practice. Each item links the responsible source location so the claim can be
verified. The list is descriptive, not prescriptive — some of these are deliberate and load-bearing,
others are accumulated debt.

## 1. One codebase, four apps — and the backend owns the UI

A single env var, `NUXT_PUBLIC_API_BASE_URL`, selects which of the four app instances (VICAV, SHAWI,
TUNOCENT, Wibarab) is rendered. Branding, navigation, theme colors, and even the _initial window
layout_ all come from the backend `/project` response:

| Backend field                        | Consumed at                              | Effect                       |
| ------------------------------------ | ---------------------------------------- | ---------------------------- |
| `projectConfig.title`                | `app/layouts/default.vue`                | `<title>`, `og:site_name`    |
| `projectConfig.menu`                 | `app/components/app-navigation-menu.vue` | Full navigation tree         |
| `projectConfig.styleSettings.colors` | `app/layouts/default.vue`                | CSS custom properties        |
| `projectConfig.panel`                | `app/stores/use-windows-store.ts`        | Windows opened on first load |

Consequences:

- The frontend contains no app-specific navigation config and no per-app feature flags.
- There is no i18n. `app/config/i18n.config.ts` declares a single hardcoded locale (`en`).
- Header colors are converted at runtime with `colorjs.io`, and text contrast is chosen by a
  luminance test rather than being supplied by the backend.

## 2. The URL is the entire application state

There are only two routes: `/` and `/imprint`. All content lives in WinBox windows whose complete
state is serialized into the query string by `app/utils/window-state-codec.ts` (`encodeWindowStates`
/ `decodeWindowStates`).

```
/?w=<base64 JSON of every window>&a=<arrangement>
```

- Serialized per window (`serializeWindowStates`, `app/stores/use-windows-store.ts:465`):
  `targetType`, `params`, `title`, `x`, `y`, `width`, `height`, `z`.
- Geometry is stored as viewport **percentages** rounded to two decimals
  (`viewportPercentageWith2DigitPrecision`, `app/stores/use-windows-store.ts:472`), so state
  survives resizes and different screens.
- Encoding is base64 over JSON, with a hand-rolled ASCII escaping step: every code point above
  `U+007F` is rewritten as a `\uXXXX` escape before `btoa()`
  (`app/utils/window-state-codec.ts:1-8`), which keeps the URL pure ASCII.
- `w` carries the window list, `a` the arrangement (`none`, `cascade`, `tile`, `smart-tile`,
  `column-five-flex`).
- Persistence is **debounced** by 150 ms: `schedulePersistence()`
  (`app/stores/use-windows-store.ts:496`) is triggered by a watcher over `geometryRevision` /
  `arrangement` / the serialized states (`:518-529`) plus a `route.path` watcher (`:530`). Focus,
  move and resize only bump `geometryRevision` — they no longer write the URL themselves.
- WMap windows with `endpoint: "data_markers"` drop their `dataListLayers` param before
  serialization (`getPersistedWindowParams`, `app/stores/use-windows-store.ts:457`), because that
  layer state is re-derived from the map at runtime.
- Restored state is validated against a Zod discriminated union (`app/types/global.ts:363`, wrapped
  as `WindowState` in `app/stores/use-windows-store.ts:39`); parse failures surface as toasts
  instead of crashes.
- The scheme can still exceed the ~2k URL limit that some browsers and proxies enforce. The old
  `// TODO: check url length` marker has been removed from the source, but the cliff itself remains.

## 3. Runtime validation is generated from the OpenAPI document

Rather than maintaining Zod schemas by hand, `app/composables/use-openapi-schema.ts` takes the
bundled `openapi.json`, rewrites `#/components/schemas/*` refs into `$defs`, and feeds the result to
`z.fromJSONSchema()`. One artifact therefore yields TypeScript types, an API client, _and_ runtime
response validation, all kept in lockstep with the backend contract.

The trade-off: `app/assets/openapi.json` and `app/lib/api-client/` are both gitignored and
re-downloaded from `raw.githubusercontent.com` on every `pnpm install` and `pnpm build` (see the
`generate:api-client` script). The build is consequently neither reproducible nor offline-capable.

## 4. Three hand-written caching layers

| Layer       | Location                                              | Mechanism                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR         | `server/plugins/compression.ts`                       | SHA-256 of the response body becomes the ETag; matching `If-None-Match` returns an empty 304; **compressed** bytes cached in a Nitro LRU keyed `${method}:${hash}` with in-flight promise dedup |
| SSR         | `nuxt.config.ts:32-36`                                | `features.devLogs: false` — Nuxt dev logs embed timestamps that poison the compressed-SSR cache                                                                                                 |
| Server-only | `shared/utils/use-api-client.ts:37` (`fetchWithETag`) | ETag revalidation cache plus a **refcounted single-flight** map (`currentRequests` / `currentRequestRefs`)                                                                                      |

Details worth knowing:

- Brotli is pinned to quality 6 via `node:zlib` because the default `CompressionStream("brotli")`
  quality is unusable for on-the-fly compression.
- `fetchWithETag` returns `response.clone()` per awaiter, since sharing one body stream across
  joined callers triggers "Body has already been consumed".
- `fetchWithETag` is installed only when `typeof document === "undefined"` — the browser gets plain
  `fetch`.

## 5. Correctness depends on SSR global-scope leakage

`shared/utils/use-api-client.ts:10` holds a mutable module-level singleton (`let api`) that is
reassigned on every `useApiClient()` call. The in-file comment states that the dev server isolates
API-route and frontend scopes while the production build shares a single global scope. Behaviour
therefore differs between `pnpm run dev` and the deployed container by design.

## 6. A 908-line hand-written query parser

`app/composables/use-filter-parser.ts` wraps the `liqe` library with quote-aware rewriting
(`mapOutsideQuotes`), operator normalization (`and`/`or`/`not` → uppercase, `:ANY` → `:*`), and AST
normalization to disjunctive normal form. `liqe` itself is patched (see below) purely to anchor its
generated regexes from `/…/` to `/^(…)$/`.

## 7. The project actively fights its dependencies

- **Three pnpm patches** (`patches/`): `winbox` (adds `exports` map, patches the DOM template),
  `@types/winbox`, and `liqe` (regex anchoring).
- `app/types/add-ObjectMap.groupBy.d.ts` hand-declares `Object.groupBy` / `Map.groupBy` because the
  TypeScript lib target lacks them.
- `nuxt.config.ts` maintains a 32-entry `vite.optimizeDeps.include` list, annotated with `// CJS`
  markers where relevant.

## 8. Redundant libraries coexist

| Concern     | Overlap                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Primitives  | `radix-vue` (64 files) **and** its renamed successor `reka-ui` (43 files), both live                   |
| Variants    | `cva` **and** `class-variance-authority` — the same package under two names                            |
| Maps        | `leaflet` + `maplibre-gl` + `@maplibre/maplibre-gl-leaflet`, i.e. MapLibre rendered through Leaflet    |
| Icons       | `@lucide/vue` (48 files), `@iconify/vue`, `vue-material-design-icons`, `@fortawesome/fontawesome-free` |
| Drag & drop | `sortablejs` (dependency, unused) + `vue-draggable-next`                                               |
| Data tables | `@tanstack/vue-table` frozen at `8.11.8` while every other dependency tracks latest                    |

## 9. Vendored UI-kit artifacts

`app/components/ui/icon-picker/icons-data.ts` is 13,588 lines of icon metadata, vendored into an
academic corpus viewer.

## 10. Smaller but notable choices

- **Anti-indexing by default.** `nuxt.config.ts` route rules emit `X-Robots-Tag: noindex, nofollow`
  on `/**` unless `BOTS=enabled`.
- **Source maps in production** for both client and server
  (`sourcemap: { server: true, client: true }`).
- **The footer expands without touching the DOM.** `app/components/app-footer.vue` drives the
  expand/collapse transform through a Vue `:style` binding (`:60-64`) rather than assigning
  `document.querySelector('footer').style.transform` imperatively.
- **Error handling is an acknowledged TODO.** `app/plugins/error.ts` `console.log`s stacks under
  `// TODO: remove or transform before deploying to production`; `window-content.vue:110` falls
  through to `<pre>{{ props }}</pre>` for unknown `targetType`s.
- **The "thin components, fat composables" rule breaks at the window layer.** The Pinia store calls
  `document.getElementById(windowRootId)` and `new WinBox(...)` directly
  (`app/stores/use-windows-store.ts:299`, `:304`).
- **Config is auto-imported as globals** via `imports.dirs: ["./config/"]`, which is why
  `defaultLocale` and the data-type map need no import statement.
- **Dual deploy-target heritage.** `heroku-postbuild-cleanup.js` and `/.heroku/**` in `.gitignore`
  coexist with the Kubernetes deployment path; `checkenv.mjs` dumps the environment as a test step.
- **Aggressive browser targets.** `browserslist` production is `>=0.75%`, `not dead`,
  `not op_mini all`.

## 11. AI tooling as first-class infrastructure

- `readme.md` states outright that it is "AI generated and maintained using AI".
- `specs/prompt_examples/` commits the _prompts_ used to generate and update test plans, alongside
  the test plans themselves in `specs/`.
- `opencode.json` (tracked) defines Playwright MCP subagents — test generator, healer, planner —
  with per-tool permission grants.
- `AI-transcripts/` is gitignored, indicating transcripts are considered private but expected.
- `server/plugins/compression.ts` carries an attribution comment for AI-assisted authorship.

The workflow is: write a test plan spec → generate Playwright specs from it → run them against real
backends per app variant.

## See also

- [docs/windowTypes.md](./windowTypes.md) — window `targetType` values and param schemas
- [docs/tests.md](./tests.md) — backend switching and E2E test organization
- [docs/tei-metadata-loading-caching.md](./tei-metadata-loading-caching.md) — the 3-layer TEI
  caching pipeline
- [docs/menu.md](./menu.md) — the backend-driven menu system
