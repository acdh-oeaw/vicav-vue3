# E2E Tests

## Backend Switching

One env var controls everything: `NUXT_PUBLIC_API_BASE_URL`.

| URL                                        | Backend  |
| ------------------------------------------ | -------- |
| `https://vicav-dev.acdh.oeaw.ac.at`        | vicav    |
| `https://vicav.acdh.oeaw.ac.at`            | vicav    |
| `http://localhost:8984`                    | vicav    |
| `https://shawi-api.acdh-dev.oeaw.ac.at`    | shawi    |
| `https://tunocent-api.acdh-dev.oeaw.ac.at` | tunocent |
| `https://wibarab-api.acdh-dev.oeaw.ac.at`  | wibarab  |

`playwright.config.ts` reads this var and sets `testMatch: "<backend>/**/*.@(test|spec).ts"`.

## Running Tests

```bash
# Set in .env.local (gitignored)
NUXT_PUBLIC_API_BASE_URL="https://vicav-dev.acdh.oeaw.ac.at"

# Build (PUBLIC vars baked at build time!)
pnpm run build

# Run tests
pnpm run test:e2e                # all vicav tests
pnpm run test:e2e keyboard       # only keyboard tests
```

The npm scripts use `dotenv -e .env.local` to inject the var into both the app and playwright.

## Test Locations

- `e2e/pages/vicav/menu/` — 41 test files
- `e2e/pages/tunocent/`, `e2e/pages/shawi/`, `e2e/pages/wibarab/` — other backends

## Prefer Live API Examples over `openapi.json`

`app/assets/openapi.json` is a generated/stale artifact. Its example responses only cover VICAV (and
an empty SHAWI panel) and do **not** reflect TUNOCENT, WIBARAB, or the current live data of any
backend. When you need to know what an endpoint actually returns — project config / `panel`, the
menu tree, a text's rendered HTML, a data list, a dictionary entry — **fetch it from the live
backend** instead of trusting the `openapi.json` examples:

```bash
# Project config (initial windows / panel + menus)
curl -s -H "Accept: application/json" "<backend-url>/vicav/project"

# A text's rendered HTML
curl -s -H "Accept: application/xml" "<backend-url>/vicav/text?id=<textId>"
```

Substitute `<backend-url>` from the "Backend Switching" table (or `.env.local`). This applies to
**every** backend (VICAV, TUNOCENT, SHAWI, WIBARAB) and every endpoint. The `openapi.json` is still
authoritative for the _schema_ (request/response shapes); only its _examples_ are stale.

## Current Vicav Menu Data (live)

- **Project**: Mission, News, Types of Text/Data, Contributors, Linguistics
- **Bibliographies**: 8 items (first is Explanation)
- **Profiles**: Explanation + List, Show All Profiles on Map, Contribute a Profile
- **Feature Lists**: Explanation, Cross-examine, Show All on Map, Contribute
- **Samples**: Explanation, Show All on Map, Contribute
- **Texts**: Explanation and Overview
- **Dictionaries**: 10 items (last is "Contribute a Dictionary/Glossary", so substring names like
  "Contribute a Dictionary" match)
- **Tools & Technology**: 16 items

## Initial Windows & Text-Window Verification

### Initial windows are backend-defined, not in the repo

The windows that open on first load of `/` are defined **server-side** in the backend project config
(`GET /vicav/project` → `projectConfig.panel`), **not** in the repo's `app/assets/openapi.json`.
That file only documents the VICAV example (`panel` at lines 112-152: Mission, News, "All Bibl.
Locations on Map") and an empty SHAWI panel (line 2070); TUNOCENT and wibarab are absent. To learn a
backend's initial windows, query the live backend:

```bash
curl -s -H "Accept: application/json" "<backend-url>/vicav/project" | grep -o '"panel".*'
```

Verified live (2026-09-03):

| Backend  | Initial windows (title · targetType · textId)                                             |
| -------- | ----------------------------------------------------------------------------------------- |
| vicav    | Mission (Text, vicavMission) · News (Text, vicavNews) · All Bibl. Locations on Map (WMap) |
| tunocent | Welcome to TUNOCENT (Text, tunocentOpeningPage) — a single window                         |
| shawi    | none (empty `panel`)                                                                      |

Restoration pipeline: `useProjectInfo()` (SSR-prefetched) → `initialScreenSetup` computed
(`app/stores/use-windows-store.ts:61-63`) → `initializeScreen()` navigates to `/?w=<base64(panel)>`
→ `restoreState()` → `addWindow()` per entry, triggered on mount when `route.path === "/"`
(`app/components/window-manager.client.vue:16-18`).

### Verifying a Text window loaded (and the correct text)

A `Text` window (`window-content.vue:27` → `text-window-content.vue`) fetches via `useTextById()`
(`app/composables/use-text-by-id.ts`: `retry: false`, `GET /vicav/text?id=<textId>`,
`Accept: application/xml`) and renders the returned HTML into
`<div v-if="data" class="prose max-w-3xl p-8">`. While `isPending || isPlaceholderData` the wrapper
is `opacity-50 grayscale` with a centered `LoadingIndicator`
(`<svg><title>Loading...</title></svg>`). A failed fetch leaves `.prose` absent (no retry), so an
empty window + spinner is the tell-tale sign.

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

TUNOCENT opening text (`tunocentOpeningPage`) — verified unique phrases:

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

**Windows dropdown** (`window-list-dropdown.vue`) still uses Menubar — keep `menuitem` selectors for
it.

Trigger lookups should be scoped to `[data-slot=navigation-menu-list]` with `exact: true` (see
"Locator name collisions" below); content items are scoped to `[data-slot=navigation-menu-content]`.

## Quirks

### `NUXT_PUBLIC_*` vars are read at server start, not baked at build time

`NUXT_PUBLIC_API_BASE_URL` and other `runtimeConfig.public` values are re-read from the environment
every time `.output/server/index.mjs` starts (Nitro's `nitro.envPrefix: "NUXT_"` re-applies `NUXT_*`
env vars to `runtimeConfig` on startup and per-request). Restarting the built server with a
different `NUXT_PUBLIC_API_BASE_URL` changes the backend without a rebuild.

No rebuild is needed for `test:e2e` either: `playwright.config.ts` reads the env var directly in the
test-runner process to pick `testMatch`, and `webServer` starts the server with the same
`.env.local`. The actual pitfall is `webServer.reuseExistingServer: true` (local only) — if a server
is already listening on port 3000 from a previous run, Playwright reuses it as-is and won't restart
it with the new env var. Kill any process on port 3000 before changing backends locally.

To re-verify: start `.output/server/index.mjs` with `PORT=<port>` and
`NUXT_PUBLIC_API_BASE_URL=<url>`, `curl` `/`, and check `apiBaseUrl:"..."` in the HTML payload.

### Backend selection is exact-match

`playwright.config.ts` matches `NUXT_PUBLIC_API_BASE_URL` against a hardcoded list of URLs (no
trailing slash) and throws `Unknown backend ...` for any other value. The matched backend also sets
`testMatch`, so only tests under `e2e/pages/<backend>/` run.

### Env comes from the npm scripts, not the config

The `import "dotenv/config"` in `playwright.config.ts` is commented out; the env var is injected by
the `dotenv -e .env.local` wrapper in the npm scripts. The VS Code Playwright extension UI bypasses
the npm scripts, so you must set the variable via `playwright.env` in your VS Code settings —
otherwise the config throws.

### CI vs local behaviour

| Setting                         | Local   | CI                                     |
| ------------------------------- | ------- | -------------------------------------- |
| `forbidOnly`                    | off     | on (a stray `test.only` fails the run) |
| `retries`                       | 0       | 2                                      |
| `workers`                       | default | 1                                      |
| `webServer.reuseExistingServer` | true    | false                                  |

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
(hydration + window restore), which is also the established suite convention.

### Aborting the API still serves SSR data

`page.route(...).abort()` only intercepts **browser** requests; the SSR fetch to the backend still
succeeds. In `api-error-handling.test.ts` the menu is therefore rendered from SSR HTML but
non-interactive (`**/_nuxt/**` is also aborted, so nothing hydrates): triggers are visible, clicking
does nothing, and `#window-root` never appears.

### NavigationMenu DOM/ARIA notes

reka-ui NavigationMenu uses no ARIA menu roles: root is `nav[data-slot=navigation-menu]`, the list
is `ul[data-slot=navigation-menu-list]`, triggers/items are plain buttons, content is a div with
`aria-labelledby` pointing at the trigger (so `getByLabel("<trigger>")` still resolves the open
content). `unmountOnHide` is on, so only the open dropdown's content exists in the DOM — item
lookups are unique without scoping, except where a name repeats inside one menu.

### `e2e/seed.spec.ts` never runs

It is a codegen placeholder at the `e2e/` root, outside any backend folder, so it does not match
`testMatch` (`<backend>/**/*.@(test|spec).ts`).

### Unit tests

- Co-located with sources; Nuxt component tests use the `.nuxt.spec.ts` suffix (`@nuxt/test-utils`).
- `vitest.config.ts` explicitly excludes `**/e2e/**`.
- `pnpm run test:unit` runs with `--typecheck --passWithNoTests`.

### `pnpm run test` is a full gate, not just tests

It runs, in order: `checkenv.mjs` (env dump), `pnpm playwright install` (downloads browsers), then
in parallel: `format:check`, all `lint:*:check-no-cache`, `types:check`, `test:unit`, `test:e2e`. A
formatting nit fails the run, and it requires `.env.local` to exist (the `dotenv -e` wrapper fails
otherwise).

### CI test jobs

E2E in CI runs per backend variant (vicav, shawi, tunocent, wibarab) via the reusable
`acdh-oeaw/gl-autodevops-minimal-port` workflow `herokuish-tests-db-url.yaml`, against the built
Herokuish image. The local `starter.yaml` only contains env-setup jobs.

### API path prefix is hardcoded `/vicav/`

The generated client (`app/lib/api-client/index.ts`) uses fixed paths — `GET /vicav/project`
(line 2129) and `GET /vicav/text` (line 2173) — for **every** backend. TUNOCENT, SHAWI, and WIBARAB
all serve their API under the same `/vicav/` prefix; the backend is selected purely by the base URL
(`NUXT_PUBLIC_API_BASE_URL`), and the path segment never changes. So when fetching live examples
(see "Prefer Live API Examples over `openapi.json`"), use `<backend-url>/vicav/...` regardless of
which backend you are on.
