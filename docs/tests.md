# E2E Tests

## Backend Switching

One env var controls everything: `NUXT_PUBLIC_API_BASE_URL`.

| URL                                        | Backend  | Variant |
| ------------------------------------------ | -------- | ------- |
| `https://vicav-dev.acdh.oeaw.ac.at`        | vicav    | dev     |
| `https://vicav.acdh.oeaw.ac.at`            | vicav    | prod    |
| `http://localhost:8984`                    | vicav    | local   |
| `https://shawi-api.acdh-dev.oeaw.ac.at`    | shawi    | dev     |
| `https://shawi-api.acdh.oeaw.ac.at`        | shawi    | prod    |
| `https://tunocent-api.acdh-dev.oeaw.ac.at` | tunocent | dev     |
| `https://tunocent-api.acdh.oeaw.ac.at`     | tunocent | prod    |
| `https://wibarab-api.acdh-dev.oeaw.ac.at`  | wibarab  | dev     |
| `https://wibarab-api.acdh.oeaw.ac.at`      | wibarab  | prod    |

### Backend matching is exact-match

`playwright.config.ts` switches on the **full string** `process.env.NUXT_PUBLIC_API_BASE_URL` (no
trailing slash, no prefix matching). Any other value aborts the run before collection:

```
Error: Unknown backend https://wibarab-api.acdh-ch-dev.oeaw.ac.at
    at file:///V:/vicav-vue3/playwright.config.ts:35:10
```

Note the commented-out `https://wibarab-api.acdh-ch-dev.oeaw.ac.at` in `.env.local` is **not** in
the list above (`-ch-dev` vs `-dev`) — uncommenting it fails the config.

The matched backend name is used for `testMatch: "<backend>/**/*.@(test|spec).ts"`. Playwright
prefixes every non-`**/` pattern with `**/`, so the effective pattern is
`**/<backend>/**/*.@(test|spec).ts`: a file runs iff **any directory segment** of its path equals
the backend name (verified in `playwright-core`'s `createFileMatcher`). Consequence:

- `e2e/pages/vicav/menu/x.test.ts` runs for backend `vicav` only.
- `e2e/seed.spec.ts` (at the `e2e/` root) never runs for any backend.

## Test Locations and Counts

Counts below are from `npx playwright test --list` (all three browser projects) on **2026-10-23**.

| Backend  | Directory                    | Files | Tests (×3 browsers) |
| -------- | ---------------------------- | ----- | ------------------- |
| vicav    | `e2e/pages/vicav/` + `menu/` | 46    | 162                 |
| tunocent | `e2e/pages/tunocent/`        | 13    | 138                 |
| shawi    | `e2e/pages/shawi/` + `menu/` | 7     | 48                  |
| wibarab  | `e2e/pages/wibarab/`         | 2     | 21                  |
| —        | `e2e/seed.spec.ts`           | 1     | never runs          |

- `e2e/pages/vicav/` holds 3 top-level files (`index.test.ts`, `map.test.ts`, `imprint.test.ts`)
  plus 43 files in `e2e/pages/vicav/menu/` — the largest suite.
- `e2e/pages/tunocent/` uses `.spec.ts` for most files, `.test.ts` for a few.
- `e2e/pages/shawi/` holds 2 top-level files plus 5 in `e2e/pages/shawi/menu/`.
- `e2e/pages/wibarab/` holds only `index.test.ts` and `imprint.test.ts`.
- Every test file is executed by all three projects (chromium, firefox, webkit).

## Running Tests

| Script                      | What it does                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run test`             | Full gate: `dotenv -e .env.local -- node checkenv.mjs` (env dump) → `pnpm playwright install` → in parallel `format:check`, `lint:*:check-no-cache`, `types:check`, `test:unit`, `test:e2e`. |
| `pnpm run test:e2e`         | `dotenv -e .env.local -- playwright test`. Needs a **pre-built** app (see below).                                                                                                            |
| `pnpm run test:e2e:ui`      | `dotenv -e .env.local -- playwright test --ui` — Playwright UI mode.                                                                                                                         |
| `pnpm run test:e2e:debug`   | Playwright `--debug`.                                                                                                                                                                        |
| `pnpm run test:e2e:codegen` | Playwright codegen (used to create `e2e/seed.spec.ts`).                                                                                                                                      |
| `pnpm run test:unit`        | `vitest --run --typecheck --passWithNoTests`.                                                                                                                                                |
| `pnpm run validate`         | `format:check` + `lint:check` + `types:check` + `test:unit` (no E2E).                                                                                                                        |
| `pnpm run build`            | `generate:api-client` (downloads `openapi.json` from GitHub + regenerates `app/lib/api-client/`) → `nuxt build --dotenv ./.env.local`.                                                       |
| `pnpm run start:local`      | `dotenv -e .env.local -- pnpm run start` → `node .output/server/index.mjs`. This is what Playwright's `webServer` runs.                                                                      |

All `test:*` scripts require `.env.local` (the `dotenv -e` wrapper fails without it).

### Is a rebuild needed for a backend switch?

**No.** `NUXT_PUBLIC_API_BASE_URL` is a `runtimeConfig.public` value: Nitro re-applies `NUXT_*` env
vars to the runtime config on **server start** (and per request), so restarting
`.output/server/index.mjs` with a different value switches the backend without rebuilding.

- `pnpm run test:e2e` needs an existing `.output/` build (`pnpm run build` once), but not a rebuild
  per backend.
- `playwright.config.ts` reads the env var directly in the test-runner process to pick `testMatch`;
  `webServer` starts `pnpm run start:local`, which loads the same `.env.local`.
- The real pitfall is `webServer.reuseExistingServer: !isCI`: locally Playwright **reuses** whatever
  already listens on port 3000 and will not restart it with the new env var. Kill the process on
  port 3000 before switching backends locally.

## Prefer Live API Examples over `openapi.json`

`app/assets/openapi.json` is a generated artifact. Its **schema** is authoritative
(`components.schemas.ProjectConfig` → `projectConfig_type`, whose `panel` property is an array of
`item_type`), but its **examples** are stale: the `GET /vicav/project` response carries only two
examples, `project_config_VICAV` (panel: Mission, News, "All Bibl. Locations on Map") and
`project_config_SHAWI` (panel: `[]`, while SHAWI now serves a non-empty panel live). There are no
TUNOCENT/WIBARAB examples.

When you need to know what an endpoint actually returns — project config / `panel`, the menu tree, a
text's rendered HTML — **fetch it from the live backend**:

```bash
# Project config (initial windows / panel + menus)
curl -s -H "Accept: application/json" "<backend-url>/vicav/project"

# A text's rendered HTML
curl -s -H "Accept: application/xml" "<backend-url>/vicav/text?id=<textId>"
```

Substitute `<backend-url>` from the "Backend Switching" table (or `.env.local`). This applies to
**every** backend (VICAV, TUNOCENT, SHAWI, WIBARAB) and every endpoint.

## Current Vicav Menu Data (live)

Live counts below are **snapshots of the backend content, not repo state** — the backend can change
them at any time, so re-verify (via `GET /vicav/project`) before relying on them in a test.

Re-verified live **2026-10-23** against `https://vicav-dev.acdh.oeaw.ac.at/vicav/project`
(previously 2026-09-03). The frontend renders `menu.title` for the triggers and `item.title` for the
content items (`app/components/app-navigation-menu.vue`), so the titles below are what the tests
see.

| Trigger (dropdown) | Items | Titles                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project            | 5     | Mission, News, Types of Text/Data, Contributors, Linguistics                                                                                                                                                                                                                                                                                                                                       |
| Bibliographies     | 8     | Explanation, All Bibl. Locations on Map, All Bibl. Regions on Map, All Bibl. Dialect Regions on Map, All Dictionaries in Bibl. on Map, All Textbooks in Bibl. on Map, Query Bibliography, Contribute to the Bibliography                                                                                                                                                                           |
| Profiles           | 3     | Explanation + List, Show All Profiles on Map, Contribute a Profile                                                                                                                                                                                                                                                                                                                                 |
| Feature Lists      | 4     | Explanation, Cross-examine the VICAV Feature Lists, Show All Feature Lists on Map, Contribute a Feature List                                                                                                                                                                                                                                                                                       |
| Samples            | 3     | Explanation, Show All Samples on Map, Contribute a Sample Text                                                                                                                                                                                                                                                                                                                                     |
| Texts              | 1     | Explanation and Overview                                                                                                                                                                                                                                                                                                                                                                           |
| Dictionaries       | 10    | All Dictionaries in Bibl. on Map, All VICAV Dictionaries on Map, Query the VICAV Dictionaries, TUNICO Dictionary, Damascus Dictionary, Cairo Dictionary, Baghdad Dictionary, MSA Dictionary, Technicalities, Contribute a Dictionary/Glossary                                                                                                                                                      |
| Tools & Technology | 16    | Dictionary Editor (VLE), Arabic Research Tools, Corpora (Spoken Varieties), Corpora (MSA), Special Corpora, Corpora (Historical Varieties), Dictionaries, Language Processing Tools, Other Websites & Projects, Learning Materials, Textbook Syrian Arabic (Sound files), Textbook Baghdad Arabic (Sound files), Vocabularies on Smartphones, Available Programs, Available Data, Keyboard Layouts |

Counts are per menu **entry** (separators excluded) and match the assertions in the E2E suite
(`toHaveCount(8)`, `10`, `4`, `3`, `5`, `3`, `1`, `16`, and 8 category triggers). Note the last
Dictionaries item is titled "Contribute a Dictionary/Glossary", so substring names like "Contribute
a Dictionary" match.

## Initial Windows & Text-Window Verification

### Initial windows are backend-defined, not in the repo

The windows that open on first load of `/` are defined **server-side** in the backend project config
(`GET /vicav/project` → `projectConfig.panel`), **not** in the repo's `app/assets/openapi.json`.

Verified live **2026-10-23** (dev backends):

| Backend  | Initial windows (title · targetType · textId)                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| vicav    | Mission (Text, `vicavMission`) · News (Text, `vicavNews`) · All Bibl. Locations on Map (WMap, endpoint `bibl_markers_tei`) |
| tunocent | Welcome to TUNOCENT (Text, `tunocentOpeningPage`) — a single window                                                        |
| shawi    | The Shawi Project (Text, `shawi.paratexts.about`) — a single window                                                        |
| wibarab  | Welcome (Text, `wibarab.paratexts.index`) · Map (ListMap, `wibarabFeatures`) — two windows                                 |

Note: the VICAV panel item is titled "News" but labelled "VICAV News"; the window title comes from
`title`.

### Restoration pipeline

`app/stores/use-windows-store.ts`:

```
restoreState()                                          // :186
  → cancelPersistence(); restoring = true
  → try { route.query.w present and decodable?
      yes → states = decodeWindowStates(String(route.query.w))   // app/utils/window-state-codec.ts
             arrangement = route.query.a (if it is a known arrangement, else "column-five-flex")
      no  → catch: toast "RestoreState Error" (only if route.query.w was present)
             await suspense()                       // waits for the SSR-prefetched useProjectInfo()
             states = initialScreenSetup.value      // data.value?.projectConfig?.panel ?? []  (:76)
    }
  → await nextTick()
  → close every window currently in the registry
  → for (const state of states) openWindowState(state, { reuse: false })   // :235
  → setWindowArrangement(restoredArrangement)
  → await nextTick()
  → finally: restoring = false; schedulePersistence()                    // :496
```

- `restoreState()` is called from `app/components/window-manager.client.vue:19-21` (on mount, when
  `route.path === "/"`). There is no `initializeScreen()` step and no navigation to `/?w=<base64>`
  before the restore: the URL is written back afterwards by the debounced (150 ms)
  `schedulePersistence()`.
- `openWindowState()` merges the backend's configured defaults for a `textId` (looked up in
  `projectConfig.menu.main`) into the state before validating it with the `WindowState` Zod schema;
  a parse failure shows the toast "AddWindow Error: parameter parse failed" and skips the window.
- `addWindow()` (`:294`) is a different entry point — it opens a _new_ window from the menu
  (`reuse: true`), it is not used for restoring.
- URL encoding (`app/utils/window-state-codec.ts`): `encodeWindowStates()` =
  `btoa(JSON.stringify(...))` with all non-ASCII characters escaped as `\uXXXX`;
  `decodeWindowStates()` = `JSON.parse(atob(...))` and throws unless the result is an array. The
  query string is `?w=<base64>&a=<arrangement>` (`a` ∈
  `none | cascade | tile | smart-tile | column-five-flex`).
- Unit tests for this pipeline live in `app/stores/use-windows-store.nuxt.spec.ts` (malformed URLs
  fall back to the initial state, Unicode round-trip, legacy `z` geometry field, duplicate windows).

### Verifying a Text window loaded (and the correct text)

A `Text` window (`app/components/window-content.vue:27` → `app/components/text-window-content.vue`)
fetches via `useTextById()` (`app/composables/use-text-by-id.ts`: `retry: false`,
`api.vicav.getText({ id }, { headers: { accept: "application/xml" } })` →
`GET /vicav/text?id=<textId>`) and renders the returned HTML into

```
<div v-if="data" class="prose max-w-3xl p-8" v-html="data" />     // text-window-content.vue:32
```

While `isPending || isPlaceholderData` the wrapper gets `opacity-50 grayscale` (`:26`) and a
`<Centered><LoadingIndicator /></Centered>` (`:34-36`) is rendered — the indicator is an `<svg>`
with `<title>Loading...</title>` (`app/components/ui/loading-indicator.vue`).

**Failure behaviour:** the query has `retry: false`, so a failed fetch never produces `.prose`; the
vue-query `QueryCache.onError` (`app/plugins/query-client.ts`) shows a toast titled "Error"
(foreground, variant `negative`) with the RFC7807 problem title/detail. The spinner disappears when
the query settles into the error state (`isPending` → false) — so "no `.prose`" is the reliable
signal, not a permanent spinner.

To assert a Text window **loaded**:

1. Hydration gate first:
   `await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })`.
2. Scope to the window by its title bar —
   `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^<title>$/ }) })`. **Not**
   `.winbox.focus` (on first load focus is the _last_ restored window).
3. `await expect(winbox.locator(".prose")).toBeVisible({ timeout: 15000 })` — `.prose` only exists
   once data resolved.
4. `await expect(winbox.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ }) })).not.toBeVisible()`
   — spinner gone.

To prove it loaded the **correct** text (right `textId`), assert unique, stable phrases scoped to
`winbox.locator(".prose")` — never page-wide `getByText` (locator name collisions). A good
discriminator is the document `<h2>` plus one or two body phrases. Playwright normalizes whitespace,
so phrases match across the backend's source line breaks.

TUNOCENT opening text (`tunocentOpeningPage`) — phrases verified live 2026-10-23:

- heading `The TUNOCENT project` (the About text's `<h2>` is only `TUNOCENT`, so this is unique to
  the opening page)
- `learn about the TUNOCENT-project, its team members and activities`
- `transcribed narratives, ethnographic texts and conversations`
- (semi-volatile, mirror live counts — secondary only) `71 Profiles`, `195 Feature lists`,
  `24 Corpus texts`, `2683 entries`

**Triage** (content vs frontend):
`curl -s -H "Accept: application/xml" "<backend-url>/vicav/text?id=<textId>"` — if the phrase is
still in the response the failure is a frontend regression; if it's gone it's a backend content
change (update the phrase, not the code).

A full worked example lives in `specs/text-window-display-test-plan.md` (TUNOCENT initial text).
Note the pre-existing `e2e/pages/tunocent/index.test.ts` "should show initial windows" only checks
the window **title** (`div` filter `.nth(1)`) — it does not verify content or loading state.

## Selector Patterns

| Old (Menubar)                | New (NavigationMenu)                    |
| ---------------------------- | --------------------------------------- |
| `getByRole("menuitem", ...)` | `getByRole("button", ...)`              |
| `[role='menu']`              | `[data-slot=navigation-menu-content]`   |
| `[role='menubar']`           | `[data-slot=navigation-menu]`           |
| `[role='separator']`         | `[data-slot=navigation-menu-separator]` |

**Windows dropdown** (`app/components/window-list-dropdown.vue`) still uses Menubar — keep
`menuitem` selectors for it (e.g. `page.getByRole("menuitem", { name: "Windows" })`).

Trigger lookups should be scoped to `[data-slot=navigation-menu-list]` with `exact: true` (see
"Locator name collisions" below); content items are scoped to `[data-slot=navigation-menu-content]`.

## Quirks

### `NUXT_PUBLIC_*` vars are read at server start, not baked at build time

`NUXT_PUBLIC_API_BASE_URL` and other `runtimeConfig.public` values are re-read from the environment
every time `.output/server/index.mjs` starts (Nitro's `nitro.envPrefix: "NUXT_"` re-applies `NUXT_*`
env vars to `runtimeConfig` on startup and per-request). Restarting the built server with a
different `NUXT_PUBLIC_API_BASE_URL` changes the backend without a rebuild.

To re-verify: start `.output/server/index.mjs` with `PORT=<port>` and
`NUXT_PUBLIC_API_BASE_URL=<url>`, `curl` `/`, and check `apiBaseUrl:"..."` in the HTML payload.

### Env comes from the pnpm scripts, not the config

The `import "dotenv/config"` in `playwright.config.ts` is commented out; the env var is injected by
the `dotenv -e .env.local` wrapper in the pnpm scripts. The VS Code Playwright extension UI bypasses
the pnpm scripts, so you must set the variable via `playwright.env` in your VS Code settings —
otherwise the config throws "Unknown backend undefined".

### CI vs local behaviour

| Setting                         | Local                        | CI                                     |
| ------------------------------- | ---------------------------- | -------------------------------------- |
| `forbidOnly`                    | off                          | on (a stray `test.only` fails the run) |
| `retries`                       | 0                            | 2                                      |
| `workers`                       | not set (Playwright default) | not set (Playwright default)           |
| `webServer.reuseExistingServer` | true                         | false                                  |
| `trace` / `video`               | `on-first-retry`             | `on-first-retry`                       |

`workers` is **not** configured in `playwright.config.ts` — parallelism comes from Playwright's
default (a fraction of the CPU cores) unless the reusable CI workflow restricts it via
`--workers`/`PLAYWRIGHT_WORKERS`. `fullyParallel` is `true`, `reporter` is `"html"`, and all three
desktop projects (chromium, firefox, webkit) run the same test files.

### Browser projects need WebGL flags

Map rendering (MapLibre/Leaflet) requires WebGL: chromium launches with `--use-gl=angle`, firefox
with `dom.webgpu.enabled` / `webgl.enable-webgl2` prefs. Three desktop browsers run; the mobile
projects are commented out.

### Tests run against live backends

E2E tests hit the real backend APIs, so they can break when backend **content** changes (e.g., menu
items, dictionary entries) rather than frontend code. See "Current Vicav Menu Data (live)" above.

### NavigationMenu triggers: clicks are swallowed by design

reka-ui's `NavigationMenuTrigger` ignores clicks that follow a pointermove (hover-open design, ~200
ms debounce). Playwright's `.click()` **always** dispatches a pointermove first, so under automation
a trigger click never toggles the menu directly — the menu opens via the hover debounce, and an open
menu **cannot be closed by clicking its trigger**. In tests: wait for
`[data-slot=navigation-menu-content]` to be visible after `.click()` before asserting or pressing
keys; close with `Escape` (handled globally) or by moving the mouse away. The Windows Menubar
trigger has no such guard — plain clicks work there.

### WebKit does not focus buttons on mouse click

After `.click()`, focus stays on `<body>` in webkit (chromium/firefox focus the button). Call
`.focus()` explicitly on the trigger before sending arrow keys.

### Tab order is not the DOM order

On load, Winbox moves focus into the last open window (`.winbox.focus`), so Tab starts inside a
window. And when tabbing from `<body>`, all browsers skip the off-screen skip link; firefox and
webkit additionally skip the logo link, which has no accessible name (`<img alt="">`). Observed
first stops: chromium → logo → Project (2 Tabs); firefox/webkit → Project (1 Tab). Pattern used by
the keyboard tests: `page.mouse.click(5, 30)` (neutral spot in the header padding → focus body),
then a Tab loop (max 4) until the trigger is focused — don't assert an exact Tab sequence.

### Locator name collisions (substring matching)

`getByRole(name)` matches by **substring** by default (use `exact: true` to opt out). The default
windows include a map window whose layer buttons are named "Profiles", "Samples", "Features", "VICAV
Dictionaries" — these collide with menu trigger names page-wide. Scope trigger lookups to
`[data-slot=navigation-menu-list]` + `exact: true`, and item lookups to
`[data-slot=navigation-menu-content]`. Note the content is teleported **inside** the
`[data-slot=navigation-menu]` root, so scoping to the root does not exclude items (e.g.
"Cross-examine the VICAV Feature Lists" substring-matches "Feature Lists").

### Clicks before hydration are no-ops

Menu handlers only exist after client hydration. Under parallel load a test can click a trigger
before hydration finishes; the click is then silently dropped and the test times out waiting for the
dropdown. Every test should first `await expect(page.locator("#window-root")).toBeInViewport()`
(hydration + window restore), which is also the established suite convention. `#window-root` is the
id of the client-only window root (`app/utils/constants.ts` → `windowRootId`).

### Aborting the API still serves SSR data

`page.route(...).abort()` only intercepts **browser** requests; the SSR fetch to the backend still
succeeds. In `e2e/pages/vicav/menu/api-error-handling.test.ts` the menu is therefore rendered from
SSR HTML but non-interactive (`**/_nuxt/**` is also aborted, so nothing hydrates): triggers are
visible, clicking does nothing, and `#window-root` never appears.

### NavigationMenu DOM/ARIA notes

reka-ui NavigationMenu uses no ARIA menu roles: root is `nav[data-slot=navigation-menu]`, the list
is `ul[data-slot=navigation-menu-list]`, triggers/items are plain buttons, content is a div with
`aria-labelledby` pointing at the trigger (so `getByLabel("<trigger>")` still resolves the open
content). `unmountOnHide` is on, so only the open dropdown's content exists in the DOM — item
lookups are unique without scoping, except where a name repeats inside one menu.

### `e2e/seed.spec.ts` never runs

It is a codegen placeholder at the `e2e/` root, outside any backend folder, so it does not match
`testMatch` (`**/<backend>/**/*.@(test|spec).ts`).

### Unit tests

- Co-located with sources; Nuxt component tests use the `.nuxt.spec.ts` suffix (`@nuxt/test-utils`).
  34 unit test files exist (e.g. `app/stores/use-windows-store.nuxt.spec.ts`,
  `app/components/dict-entry.nuxt.spec.ts`, `app/utils/api-error.test.ts`).
- `vitest.config.ts` explicitly excludes `**/e2e/**`.
- `pnpm run test:unit` runs with `--typecheck --passWithNoTests`.

### `pnpm run test` is a full gate, not just tests

It runs, in order: `checkenv.mjs` (env dump), `pnpm playwright install` (downloads browsers), then
in parallel: `format:check`, all `lint:*:check-no-cache`, `types:check`, `test:unit`, `test:e2e`. A
formatting nit fails the run, and it requires `.env.local` to exist (the `dotenv -e` wrapper fails
otherwise).

### CI test jobs

`.github/workflows/starter.yaml` (triggered on every push and via `workflow_dispatch`) contains only
environment setup and job wiring; the actual work is delegated to reusable workflows of
`acdh-oeaw/gl-autodevops-minimal-port`:

| Job                                                   | Reusable workflow                           | Purpose                                      |
| ----------------------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `setup_workflow_env`                                  | —                                           | environment/registry/branch → outputs        |
| `generate_workflow_vars{,_shawi,_tunocent,_wibarab}`  | —                                           | per-variant env + `PUBLIC_URL`               |
| `_1`                                                  | `build-herokuish-and-push-to-registry.yaml` | build image, push to registry                |
| `_2` (vicav), `_2_shawi`, `_2_tunocent`, `_2_wibarab` | `herokuish-tests-db-url.yaml`               | per-backend test run against the built image |
| `_3`, `_3-shawi`, `_3_tunocent`, `_3_wibarab`         | `deploy.yml`                                | deploy to Kubernetes                         |

The backend is selected in CI through the environment variables of the corresponding GitHub
environment (`NUXT_PUBLIC_API_BASE_URL`), not via a local `.env.local`; the per-variant test jobs
therefore exercise the same four backends as the local `testMatch` split. The reusable workflow
itself lives outside this repository — per `readme.md` it runs Vitest **and** Playwright E2E.

### API path prefix is hardcoded `/vicav/`

The generated client (`app/lib/api-client/index.ts`, regenerated by `pnpm run generate:api-client`)
uses fixed paths — `getProject` → `GET /vicav/project` and `getText` → `GET /vicav/text` (cite the
operation names, not line numbers) — for **every** backend. TUNOCENT, SHAWI, and WIBARAB all serve
their API under the same `/vicav/` prefix; the backend is selected purely by the base URL
(`NUXT_PUBLIC_API_BASE_URL`), and the path segment never changes. So when fetching live examples,
use `<backend-url>/vicav/...` regardless of which backend you are on.

## Maintenance Prompt

Use this prompt after changing `playwright.config.ts`, `vitest.config.ts`, the pnpm scripts in
`package.json`, `.github/workflows/starter.yaml`, any file under `e2e/`, the window restore pipeline
(`app/stores/use-windows-store.ts`, `app/utils/window-state-codec.ts`,
`app/components/window-manager.client.vue`), or the Text-window rendering
(`app/components/window-content.vue`, `app/components/text-window-content.vue`,
`app/composables/use-text-by-id.ts`):

```text
Review playwright.config.ts (backend URL switch, testMatch, projects/browser flags, webServer
settings, forbidOnly/retries/workers), vitest.config.ts, the pnpm scripts in package.json, and
.github/workflows/starter.yaml (job graph, reusable workflows, per-backend test jobs).
Review the e2e/ tree for the current test file counts, locations, and selector conventions.
Review app/stores/use-windows-store.ts (restoreState(), initialScreenSetup, openWindowState(),
addWindow(), schedulePersistence()), app/utils/window-state-codec.ts (w=/a= URL state encoding), and
app/components/window-manager.client.vue (when the restore is triggered).
Review app/components/window-content.vue, app/components/text-window-content.vue, and
app/composables/use-text-by-id.ts for the Text window render branch, loading state, and markup.

Update docs/tests.md so it accurately documents the current implemented test setup and behavior.

Include:
- the accepted NUXT_PUBLIC_API_BASE_URL values, their backend mapping, and how the backend is matched
  (exact match, unknown-backend error)
- test file counts and directory layout per backend
- the current restoration pipeline from URL state or projectConfig.panel to opened windows
- Text window loading/rendering contract: .prose markup, loading indicator, failure behavior, and
  the selectors used to assert that a window loaded and loaded the correct textId
- CI behavior: per-backend test jobs, the workflows they call, and local-vs-CI config differences
- pnpm script semantics (test as a full gate, test:e2e, test:unit, build, start:local) and whether
  a rebuild is needed for a backend switch
- selector patterns and known quirks (hydration gate, substring locator collisions, focus and tab
  order, SSR-only data when requests are aborted, NavigationMenu click handling)
- re-verified live backend claims: the initial-window table and the menu item counts

For live claims, re-verify against the live backends instead of reusing the old numbers, e.g.
  curl -s -H "Accept: application/json" "<backend-url>/vicav/project"
and record the date of the verification. Prefer schema/example names over line numbers for
app/assets/openapi.json and the generated client, and re-check every file.ts:NNN reference so it
still resolves to the described code.

Keep the document concise, table/list driven, and consistent with the existing format. Do not change
application code.
```
