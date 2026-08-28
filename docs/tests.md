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

### E2E requires a pre-built app

The Playwright `webServer` runs `pnpm run start:local`, which starts the **built** server
(`.output/server/index.mjs`). `NUXT_PUBLIC_*` variables are baked into the client bundle at build
time, so after changing `NUXT_PUBLIC_API_BASE_URL` in `.env.local` you must re-run `pnpm run build`
— otherwise the tests run against the wrong backend.

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
