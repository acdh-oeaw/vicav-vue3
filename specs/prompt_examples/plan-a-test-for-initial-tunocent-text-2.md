# **Title:** Plan Playwright Test: Verify Initial Text on Tunocent Instance

**Session ID:** ses_f9c0afc11ffeMTc8jjzIZWrVxC **Created:** 2.9.2026, 23:09:56 **Updated:**
3.9.2026, 00:35:03

---

## User

Read the contents of `docs/` and `specs/` directories to get information about the code. Use
@playwright-test-planner to plan a test. I need one test that verifies that the initial text is
loaded on a tunocent instance of this web site in a window. Find a few lines or phrases that ensure
it is the correct text.

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 41.6s)

_Thinking:_

Let me start by exploring the docs/ and specs/ directories to understand the codebase, and then use
the playwright-test-planner agent to plan the tests.

First, let me take a look at the directory structure.

I'll start by exploring the docs and specs directories to understand the codebase.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\docs"
}
```

**Output:**

```
<path>V:\vicav-vue3\docs</path>
<type>directory</type>
<entries>
dict-entry-component-mapping.md
menu.md
searchbar.md
tei-metadata-loading-caching.md
tests.md
windowTypes.md

(6 entries)
</entries>
```

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\specs"
}
```

**Output:**

```
<path>V:\vicav-vue3\specs</path>
<type>directory</type>
<entries>
menu-test-plan.md
prompt_examples/
README.md
shawi-menu-test-plan.md
text-window-display-test-plan.md
tunocent-menu-test-plan.md

(6 entries)
</entries>
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 13.5s)

_Thinking:_

Let's read the relevant documentation. The most relevant ones seem to be:

- `docs/tests.md` - E2E testing guide: switching backends via environment variables, test locations,
  selector patterns for menu components
- `docs/windowTypes.md` - Reference for all window `targetType` values and their parameter schemas
  (WMap, Text, Profile, DictQuery, etc.)
- `specs/text-window-display-test-plan.md` - Test plan for VICAV's initial load Text window. Asserts
  that text is displayed (loading complete) and that the correct textId content is loaded
- `specs/tunocent-menu-test-plan.md` - Test plan for the TUNOCENT (Tunisian Arabic dialect) app.
  Includes profiles, feature lists, sample texts, and corpus search

The task is about tunocent instances and text windows. Let's read these files.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\docs\\tests.md"
}
```

**Output:**

````
<path>V:\vicav-vue3\docs\tests.md</path>
<type>file</type>
<content>
1: # E2E Tests
2:
3: ## Backend Switching
4:
5: One env var controls everything: `NUXT_PUBLIC_API_BASE_URL`.
6:
7: | URL                                        | Backend  |
8: | ------------------------------------------ | -------- |
9: | `https://vicav-dev.acdh.oeaw.ac.at`        | vicav    |
10: | `https://vicav.acdh.oeaw.ac.at`            | vicav    |
11: | `http://localhost:8984`                    | vicav    |
12: | `https://shawi-api.acdh-dev.oeaw.ac.at`    | shawi    |
13: | `https://tunocent-api.acdh-dev.oeaw.ac.at` | tunocent |
14: | `https://wibarab-api.acdh-dev.oeaw.ac.at`  | wibarab  |
15:
16: `playwright.config.ts` reads this var and sets `testMatch: "<backend>/**/*.@(test|spec).ts"`.
17:
18: ## Running Tests
19:
20: ```bash
21: # Set in .env.local (gitignored)
22: NUXT_PUBLIC_API_BASE_URL="https://vicav-dev.acdh.oeaw.ac.at"
23:
24: # Build (PUBLIC vars baked at build time!)
25: pnpm run build
26:
27: # Run tests
28: pnpm run test:e2e                # all vicav tests
29: pnpm run test:e2e keyboard       # only keyboard tests
30: ```
31:
32: The npm scripts use `dotenv -e .env.local` to inject the var into both the app and playwright.
33:
34: ## Test Locations
35:
36: - `e2e/pages/vicav/menu/` — 41 test files
37: - `e2e/pages/tunocent/`, `e2e/pages/shawi/`, `e2e/pages/wibarab/` — other backends
38:
39: ## Current Vicav Menu Data (live)
40:
41: - **Project**: Mission, News, Types of Text/Data, Contributors, Linguistics
42: - **Bibliographies**: 8 items (first is Explanation)
43: - **Profiles**: Explanation + List, Show All Profiles on Map, Contribute a Profile
44: - **Feature Lists**: Explanation, Cross-examine, Show All on Map, Contribute
45: - **Samples**: Explanation, Show All on Map, Contribute
46: - **Texts**: Explanation and Overview
47: - **Dictionaries**: 10 items (last is "Contribute a Dictionary/Glossary", so substring names like
48:   "Contribute a Dictionary" match)
49: - **Tools & Technology**: 16 items
50:
51: ## Selector Patterns
52:
53: | Old (Menubar)                | New (NavigationMenu)                    |
54: | ---------------------------- | --------------------------------------- |
55: | `getByRole("menuitem", ...)` | `getByRole("button", ...)`              |
56: | `[role='menu']`              | `[data-slot=navigation-menu-content]`   |
57: | `[role='menubar']`           | `[data-slot=navigation-menu]`           |
58: | `[role='separator']`         | `[data-slot=navigation-menu-separator]` |
59:
60: **Windows dropdown** (`window-list-dropdown.vue`) still uses Menubar — keep `menuitem` selectors for
61: it.
62:
63: Trigger lookups should be scoped to `[data-slot=navigation-menu-list]` with `exact: true` (see
64: "Locator name collisions" below); content items are scoped to `[data-slot=navigation-menu-content]`.
65:
66: ## Quirks
67:
68: ### `NUXT_PUBLIC_*` vars are read at server start, not baked at build time
69:
70: `NUXT_PUBLIC_API_BASE_URL` and other `runtimeConfig.public` values are re-read from the environment
71: every time `.output/server/index.mjs` starts (Nitro's `nitro.envPrefix: "NUXT_"` re-applies `NUXT_*`
72: env vars to `runtimeConfig` on startup and per-request). Restarting the built server with a
73: different `NUXT_PUBLIC_API_BASE_URL` changes the backend without a rebuild.
74:
75: No rebuild is needed for `test:e2e` either: `playwright.config.ts` reads the env var directly in the
76: test-runner process to pick `testMatch`, and `webServer` starts the server with the same
77: `.env.local`. The actual pitfall is `webServer.reuseExistingServer: true` (local only) — if a server
78: is already listening on port 3000 from a previous run, Playwright reuses it as-is and won't restart
79: it with the new env var. Kill any process on port 3000 before changing backends locally.
80:
81: To re-verify: start `.output/server/index.mjs` with `PORT=<port>` and
82: `NUXT_PUBLIC_API_BASE_URL=<url>`, `curl` `/`, and check `apiBaseUrl:"..."` in the HTML payload.
83:
84: ### Backend selection is exact-match
85:
86: `playwright.config.ts` matches `NUXT_PUBLIC_API_BASE_URL` against a hardcoded list of URLs (no
87: trailing slash) and throws `Unknown backend ...` for any other value. The matched backend also sets
88: `testMatch`, so only tests under `e2e/pages/<backend>/` run.
89:
90: ### Env comes from the npm scripts, not the config
91:
92: The `import "dotenv/config"` in `playwright.config.ts` is commented out; the env var is injected by
93: the `dotenv -e .env.local` wrapper in the npm scripts. The VS Code Playwright extension UI bypasses
94: the npm scripts, so you must set the variable via `playwright.env` in your VS Code settings —
95: otherwise the config throws.
96:
97: ### CI vs local behaviour
98:
99: | Setting                         | Local   | CI                                     |
100: | ------------------------------- | ------- | -------------------------------------- |
101: | `forbidOnly`                    | off     | on (a stray `test.only` fails the run) |
102: | `retries`                       | 0       | 2                                      |
103: | `workers`                       | default | 1                                      |
104: | `webServer.reuseExistingServer` | true    | false                                  |
105:
106: ### Browser projects need WebGL flags
107:
108: Map rendering (MapLibre/Leaflet) requires WebGL: chromium launches with `--use-gl=angle`, firefox
109: with `dom.webgpu.enabled` / `webgl.enable-webgl2` prefs. Three desktop browsers run; the mobile
110: projects are commented out.
111:
112: ### Tests run against live backends
113:
114: E2E tests hit the real backend APIs, so they can break when backend **content** changes (e.g., menu
115: items, dictionary entries) rather than frontend code. See "Current Vicav Menu Data (live)" above.
116:
117: ### NavigationMenu triggers: clicks are swallowed by design
118:
119: reka-ui's `NavigationMenuTrigger` ignores clicks that follow a pointermove (hover-open design, ~200
120: ms debounce). Playwright's `.click()` **always** dispatches a pointermove first, so under automation
121: a trigger click never toggles the menu directly — the menu opens via the hover debounce, and an open
122: menu **cannot be closed by clicking its trigger**. In tests: wait for
123: `[data-slot=navigation-menu-content]` to be visible after `.click()` before asserting or pressing
124: keys; close with `Escape` (handled globally) or by moving the mouse away. The Windows Menubar
125: trigger has no such guard — plain clicks work there.
126:
127: ### WebKit does not focus buttons on mouse click
128:
129: After `.click()`, focus stays on `<body>` in webkit (chromium/firefox focus the button). Call
130: `.focus()` explicitly on the trigger before sending arrow keys.
131:
132: ### Tab order is not the DOM order
133:
134: On load, Winbox moves focus into the last open window (`.winbox.focus`), so Tab starts inside a
135: window. And when tabbing from `<body>`, all browsers skip the off-screen skip link; firefox and
136: webkit additionally skip the logo link, which has no accessible name (`<img alt="">`). Observed
137: first stops: chromium → logo → Project (2 Tabs); firefox/webkit → Project (1 Tab). Pattern used by
138: the keyboard tests: `page.mouse.click(5, 30)` (neutral spot in the header padding → focus body),
139: then a Tab loop (max 4) until the trigger is focused — don't assert an exact Tab sequence.
140:
141: ### Locator name collisions (substring matching)
142:
143: `getByRole(name)` matches by **substring** by default (use `exact: true` to opt out). The default
144: windows include a map window whose layer buttons are named "Profiles", "Samples", "Features", "VICAV
145: Dictionaries" — these collide with menu trigger names page-wide. Scope trigger lookups to
146: `[data-slot=navigation-menu-list]` + `exact: true`, and item lookups to
147: `[data-slot=navigation-menu-content]`. Note the content is teleported **inside** the
148: `[data-slot=navigation-menu]` root, so scoping to the root does not exclude items (e.g.
149: "Cross-examine the VICAV Feature Lists" substring-matches "Feature Lists").
150:
151: ### Clicks before hydration are no-ops
152:
153: Menu handlers only exist after client hydration. Under parallel load a test can click a trigger
154: before hydration finishes; the click is then silently dropped and the test times out waiting for the
155: dropdown. Every test should first `await expect(page.locator("#window-root")).toBeInViewport()`
156: (hydration + window restore), which is also the established suite convention.
157:
158: ### Aborting the API still serves SSR data
159:
160: `page.route(...).abort()` only intercepts **browser** requests; the SSR fetch to the backend still
161: succeeds. In `api-error-handling.test.ts` the menu is therefore rendered from SSR HTML but
162: non-interactive (`**/_nuxt/**` is also aborted, so nothing hydrates): triggers are visible, clicking
163: does nothing, and `#window-root` never appears.
164:
165: ### NavigationMenu DOM/ARIA notes
166:
167: reka-ui NavigationMenu uses no ARIA menu roles: root is `nav[data-slot=navigation-menu]`, the list
168: is `ul[data-slot=navigation-menu-list]`, triggers/items are plain buttons, content is a div with
169: `aria-labelledby` pointing at the trigger (so `getByLabel("<trigger>")` still resolves the open
170: content). `unmountOnHide` is on, so only the open dropdown's content exists in the DOM — item
171: lookups are unique without scoping, except where a name repeats inside one menu.
172:
173: ### `e2e/seed.spec.ts` never runs
174:
175: It is a codegen placeholder at the `e2e/` root, outside any backend folder, so it does not match
176: `testMatch` (`<backend>/**/*.@(test|spec).ts`).
177:
178: ### Unit tests
179:
180: - Co-located with sources; Nuxt component tests use the `.nuxt.spec.ts` suffix (`@nuxt/test-utils`).
181: - `vitest.config.ts` explicitly excludes `**/e2e/**`.
182: - `pnpm run test:unit` runs with `--typecheck --passWithNoTests`.
183:
184: ### `pnpm run test` is a full gate, not just tests
185:
186: It runs, in order: `checkenv.mjs` (env dump), `pnpm playwright install` (downloads browsers), then
187: in parallel: `format:check`, all `lint:*:check-no-cache`, `types:check`, `test:unit`, `test:e2e`. A
188: formatting nit fails the run, and it requires `.env.local` to exist (the `dotenv -e` wrapper fails
189: otherwise).
190:
191: ### CI test jobs
192:
193: E2E in CI runs per backend variant (vicav, shawi, tunocent, wibarab) via the reusable
194: `acdh-oeaw/gl-autodevops-minimal-port` workflow `herokuish-tests-db-url.yaml`, against the built
195: Herokuish image. The local `starter.yaml` only contains env-setup jobs.

(End of file - total 195 lines)
</content>
````

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\specs\\text-window-display-test-plan.md"
}
```

**Output:**

````
<path>V:\vicav-vue3\specs\text-window-display-test-plan.md</path>
<type>file</type>
<content>
1: # VICAV First-Load Text Window Display Test Plan
2:
3: ## Application Overview
4:
5: Prompt: "Make sure a text in a window is displayed when the site is loaded first. Check some of the
6: content of the text to verify it loaded the correct text."
7:
8: Application under test: VICAV3.0 - Vienna Corpus of Arabic Varieties (Vue 3/Nuxt, Winbox window
9: manager). Base URL http://localhost:3000 (Playwright webServer via `pnpm run start:local`). Backend:
10: vicav dev — `.env.local` must set `NUXT_PUBLIC_API_BASE_URL="https://vicav-dev.acdh.oeaw.ac.at"`
11: (baked per-request; no rebuild needed, but kill stale servers on :3000 before switching backends).
12:
13: Goal: on FIRST load of `/` the app restores the project config's default "panel" windows
14: (app/assets/openapi.json lines 112-152): "Mission" (targetType Text, textId vicavMission), "News"
15: (targetType Text, textId vicavNews), "All Bibl. Locations on Map" (WMap — out of scope). The
16: existing test e2e/pages/vicav/index.test.ts ("should show initial windows") only asserts the three
17: window TITLES are visible. This plan goes beyond it: (1) verify the text content inside each Text
18: window is actually displayed (loading indicator gone, .prose content rendered), and (2) assert on
19: specific phrases of the rendered text to prove the CORRECT text (right textId) was loaded.
20:
21: How Text windows render (verified): window-content.vue routes targetType Text to
22: text-window-content.vue, which fetches via useTextById (GET /vicav/text?id=<textId>, Accept:
23: application/xml; retry:false) and renders the returned HTML into
24: `<div v-if="data" class="prose max-w-3xl p-8">`. While isPending||isPlaceholderData the wrapper gets
25: `opacity-50 grayscale` and a centered LoadingIndicator (svg with `<title>Loading...</title>`) is
26: shown. Winbox chrome: each window is a `.winbox` inside `#window-root`, title in `.wb-title`,
27: content teleported into `.wb-body`. On first load the LAST restored window holds focus, so scope to
28: the window by its `.wb-title` text — do NOT use `.winbox.focus`.
29:
30: Verified live backend content (curl, 2026-09-02): vicavMission →
31: `<h2>Vienna Corpus of Arabic Varieties (VICAV)</h2>` + "VICAV is an international endeavour aiming
32: at the collection of digital language resources documenting varieties of spoken Arabic." + "VICAV
33: has a strong methodological component focusing on the development of digital data and tools." +
34: "VICAV has been started as a co-operation between the Department of Near Eastern Studies of the
35: University of Vienna and the Austrian Centre for Digital Humanities...". vicavNews →
36: `<h2 class="newsHeader">News</h2>` + multiple `<div class="newsItem">` (copy is VOLATILE — new items
37: prepended over time; assert only heading + item existence). vicavContributors →
38: `<h2>Contributors</h2>` + "VICAV is a collaborative undertaking..." (does NOT contain the Mission
39: phrases — used as negative control).
40:
41: Suite conventions (docs/tests.md): every test first
42: `await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })` (hydration + window
43: restore; clicks before hydration are silently dropped). Content assertions are scoped to the
44: specific window's `.prose`, never page-wide getByText (locator name collisions: map window layer
45: buttons, menu items). NavigationMenu: wait for `[data-slot=navigation-menu-content]` visible after
46: trigger click; close with Escape. Tests run against LIVE backends — content assertions can break
47: when backend content changes, not frontend code.
48:
49: Test file: e2e/pages/vicav/text-window-display.test.ts (new file, header comment
50: `// spec: specs/text-window-display-test-plan.md`). Run: `pnpm run build` then `pnpm run test:e2e`
51: (or `pnpm run test:e2e text-window-display`).
52:
53: ## Test Scenarios
54:
55: ### 1. First-load Text window rendering
56:
57: **Seed:** `e2e/seed.spec.ts`
58:
59: #### 1.1. Mission window shows loaded text content (loading state resolved)
60:
61: **File:** `e2e/pages/vicav/text-window-display.test.ts`
62:
63: **Steps:**
64:
65: 1. Purpose: on first load of "/", the restored Mission Text window must render its text content and
66:    must not remain stuck on the loading indicator. Preconditions: .env.local sets
67:    NUXT_PUBLIC_API_BASE_URL="https://vicav-dev.acdh.oeaw.ac.at"; app built (pnpm run build); tests
68:    run via pnpm run test:e2e against the webServer on http://localhost:3000.
69: 2. Navigate: await page.goto("/")
70:
71:    - expect: Page loads
72:
73: 3. Hydration gate (mandatory suite convention — clicks before hydration are silently dropped): await
74:    expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })
75:
76:    - expect: App hydrated and default panel windows (Mission, News, All Bibl. Locations on Map)
77:      restored
78:
79: 4. Locate the Mission window by title (NOT .winbox.focus — on first load the last restored window
80:    holds focus): const mission = page.locator(".winbox", { has: page.locator(".wb-title", { hasText:
81:    /^Mission$/ }) })
82:
83:    - expect: Exactly one .winbox matches and is visible: await expect(mission).toBeVisible()
84:
85: 5. await expect(mission.locator(".prose")).toBeVisible({ timeout: 15000 })
86:
87:    - expect: The content container div.prose (v-if="data") is rendered once GET
88:      /vicav/text?id=vicavMission resolves — the text is displayed, not an empty or spinner-only
89:      window
90:
91: 6. await expect(mission.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ })
92:    })).not.toBeVisible()
93:
94:    - expect: The centered LoadingIndicator (svg with <title>Loading...</title>) is gone —
95:      isPending/isPlaceholderData are both false
96:
97: 7. Optional: await expect(mission.locator(".wb-body > div")).not.toHaveClass(/opacity-50/)
98:
99:    - expect: The loading dim classes (opacity-50 grayscale) are removed from the content wrapper div
100:      once data loaded
101:
102: 8. Failure conditions: .prose never visible within 15s, or LoadingIndicator still visible after data
103:    should have arrived
104:
105:    - expect: Test fails if .prose never appears within 15s (text fetch failed — useTextById has
106:      retry:false, a failed request leaves the window empty with the spinner) or if the indicator
107:      persists (query stuck pending/placeholder)
108:
109: #### 1.2. Mission window content matches textId vicavMission (correct text loaded)
110:
111: **File:** `e2e/pages/vicav/text-window-display.test.ts`
112:
113: **Steps:**
114:
115: 1. Purpose: assert on specific phrases of the rendered text to prove the window loaded the CORRECT
116:    text (textId vicavMission), not some other text or a placeholder. All phrases verified against
117:    the live backend 2026-09-02.
118: 2. Navigate to "/" and pass the hydration gate: await
119:    expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })
120:
121:    - expect: Default windows restored
122:
123: 3. Locate the Mission window (same selector as previous test) and wait for content: await
124:    expect(mission.locator(".prose")).toBeVisible({ timeout: 15000 })
125:
126:    - expect: Text content rendered
127:
128: 4. Heading assertion: await expect(mission.locator(".prose h2", { hasText: /^Vienna Corpus of Arabic
129:    Varieties \(VICAV\)$/ })).toBeVisible()
130:
131:    - expect: The vicavMission document heading <h2>Vienna Corpus of Arabic Varieties (VICAV)</h2> is
132:      present — this heading is unique to this text
133:
134: 5. Stable body phrase 1: await expect(mission.locator(".prose").getByText("international endeavour
135:    aiming at the collection of digital language resources")).toBeVisible()
136:
137:    - expect: The stable opening sentence "VICAV is an international endeavour aiming at the
138:      collection of digital language resources documenting varieties of spoken Arabic." is present
139:
140: 6. Stable body phrase 2: await expect(mission.locator(".prose").getByText("strong methodological
141:    component focusing on the development of digital data and tools")).toBeVisible()
142:
143:    - expect: "VICAV has a strong methodological component focusing on the development of digital
144:      data and tools." is present
145:
146: 7. Notes: assertions are scoped to the Mission window's .prose — never page-wide getByText (locator
147:    name collisions with the map window's layer buttons and menu items). Phrases are contiguous
148:    within a single paragraph and Playwright normalizes whitespace (backend HTML contains source line
149:    breaks). These are live-backend CONTENT assertions: stable project documentation, but they break
150:    if the backend rewrites the mission text (content change, not frontend bug).
151:
152: #### 1.3. News window shows loaded content (volatile-safe assertions)
153:
154: **File:** `e2e/pages/vicav/text-window-display.test.ts`
155:
156: **Steps:**
157:
158: 1. Purpose: the restored News Text window renders content on first load. Assert only stable
159:    structure (News heading + at least one news item) — never the volatile news copy.
160: 2. Navigate to "/" and pass the hydration gate: await
161:    expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })
162:
163:    - expect: Default windows restored
164:
165: 3. Locate the News window: const news = page.locator(".winbox", { has: page.locator(".wb-title", {
166:    hasText: /^News$/ }) })
167:
168:    - expect: Exactly one window titled "News" is visible: await expect(news).toBeVisible()
169:
170: 4. await expect(news.locator(".prose")).toBeVisible({ timeout: 15000 })
171:
172:    - expect: Text content rendered (GET /vicav/text?id=vicavNews resolved)
173:
174: 5. await expect(news.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ })
175:    })).not.toBeVisible()
176:
177:    - expect: LoadingIndicator gone
178:
179: 6. await expect(news.locator("h2.newsHeader", { hasText: /^News$/ })).toBeVisible()
180:
181:    - expect: The stable <h2 class="newsHeader">News</h2> heading is present
182:
183: 7. const items = news.locator(".newsItem"); await expect(items.first()).toBeVisible(); expect(await
184:    items.count()).toBeGreaterThan(0)
185:
186:    - expect: At least one .newsItem entry is rendered (count >= 1)
187:
188: 8. Optional: await expect(news.locator(".newsItem").first().locator("p")).toBeVisible()
189:
190:    - expect: The first news item contains a text paragraph
191:
192: 9. Do NOT assert specific news item copy: new items are prepended and old ones removed over time
193:    (verified volatile, e.g. current top item is the WIBARAB / Arabic Linguistics Forum 2025 entry).
194:    Only the heading and item existence are stable.
195:
196: ### 2. Assertion specificity (negative control)
197:
198: **Seed:** `e2e/seed.spec.ts`
199:
200: #### 2.1. A different text (Contributors) does not match the Mission phrases
201:
202: **File:** `e2e/pages/vicav/text-window-display.test.ts`
203:
204: **Steps:**
205:
206: 1. Purpose: prove the content assertions of the Mission test are specific enough to catch a WRONG
207:    textId — a window loading a different text must not contain the Mission phrases. Uses Project >
208:    Contributors (textId vicavContributors), verified 2026-09-02 to contain neither the Mission h2
209:    nor the "international endeavour" phrase (it says "collaborative undertaking" instead).
210: 2. Navigate to "/" and pass the hydration gate: await
211:    expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })
212:
213:    - expect: Default windows restored
214:
215: 3. Open the Project menu: await page.locator("[data-slot=navigation-menu-list]").getByRole("button",
216:    { name: "Project", exact: true }).click(); await
217:    expect(page.locator("[data-slot=navigation-menu-content]")).toBeVisible()
218:
219:    - expect: Project dropdown opens (NavigationMenu hover-debounce: wait for the content element —
220:      do not assume the click toggled it)
221:
222: 4. await page.locator("[data-slot=navigation-menu-content]").getByRole("button", { name:
223:    "Contributors" }).click()
224:
225:    - expect: A Contributors window opens (targetType Text, textId vicavContributors)
226:
227: 5. Locate the Contributors window: const contributors = page.locator(".winbox", { has:
228:    page.locator(".wb-title", { hasText: /^Contributors$/ }) }); await
229:    expect(contributors.locator(".prose")).toBeVisible({ timeout: 15000 })
230:
231:    - expect: The Contributors text rendered (window not empty)
232:
233: 6. await expect(contributors.locator(".prose h2", { hasText: /^Contributors$/ })).toBeVisible()
234:
235:    - expect: The window shows its own heading — a different text was loaded
236:
237: 7. await expect(contributors.locator(".prose").getByText("international endeavour")).toHaveCount(0)
238:
239:    - expect: The Mission phrase is ABSENT from the Contributors window
240:
241: 8. await expect(contributors.locator(".prose h2", { hasText: /^Vienna Corpus of Arabic Varieties
242:    \(VICAV\)$/ })).toHaveCount(0)
243:
244:    - expect: The Mission heading is ABSENT from the Contributors window
245:
246: 9. Close the dropdown with await page.keyboard.press("Escape") if still open (an open NavigationMenu
247:    cannot be closed by clicking its trigger)
248:
249: ### 3. Menu cross-check (optional)
250:
251: **Seed:** `e2e/seed.spec.ts`
252:
253: #### 3.1. Reopening Mission via the Project menu renders the same content
254:
255: **File:** `e2e/pages/vicav/text-window-display.test.ts`
256:
257: **Steps:**
258:
259: 1. Purpose: cross-check that the menu-open path (not just first-load restore) loads the same
260:    vicavMission content. Note: clicking Project > Mission while the Mission window is already open
261:    only FOCUSES the existing window (use-windows-store findWindowByTypeAndParam -> focus +
262:    highlight), so the window is closed first to force a fresh open.
263: 2. Navigate to "/" and pass the hydration gate: await
264:    expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })
265:
266:    - expect: Default windows restored
267:
268: 3. Close the Mission window: await mission.locator(".wb-close").click(); await
269:    expect(mission).toBeHidden({ timeout: 10000 })
270:
271:    - expect: The Mission winbox is removed (allow time for the WinBox close animation)
272:
273: 4. Open the Project menu (trigger click + wait for [data-slot=navigation-menu-content] visible) and
274:    click the "Mission" item: await
275:    page.locator("[data-slot=navigation-menu-content]").getByRole("button", { name: "Mission"
276:    }).click()
277:
278:    - expect: A fresh Mission window opens
279:
280: 5. Re-locate the Mission window by title; await expect(mission.locator(".prose")).toBeVisible({
281:    timeout: 15000 })
282:
283:    - expect: Content rendered in the newly opened window
284:
285: 6. Assert the same three content assertions as the Mission content test: exact h2 "Vienna Corpus of
286:    Arabic Varieties (VICAV)" + "international endeavour aiming at the collection of digital language
287:    resources" + "strong methodological component focusing on the development of digital data and
288:    tools" (all scoped to the window's .prose)
289:
290:    - expect: Identical content as on first load — the menu path loads the same textId vicavMission
291:
292: ---
293:
294: ## 4. Selector Reference
295:
296: | Target                             | Suggested selector                                                                                                                                    |
297: | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
298: | Hydration gate (every test, first) | `page.locator("#window-root")` — `toBeInViewport({ timeout: 30000 })`                                                                                 |
299: | Mission window                     | `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^Mission$/ }) })`                                                               |
300: | News window                        | `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^News$/ }) })`                                                                  |
301: | Contributors window                | `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^Contributors$/ }) })`                                                          |
302: | Text content container             | `<winbox>.locator(".prose")` (only in DOM once data loaded, `v-if="data"`)                                                                            |
303: | Loading indicator                  | `<winbox>.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ }) })` (LoadingIndicator renders `<title>Loading...</title>`)       |
304: | Loading dim classes                | `<winbox>.locator(".wb-body > div")` — must NOT match `/opacity-50/` (component adds `opacity-50 grayscale` while `isPending \|\| isPlaceholderData`) |
305: | Mission heading                    | `<mission>.locator(".prose h2", { hasText: /^Vienna Corpus of Arabic Varieties \(VICAV\)$/ })`                                                        |
306: | News heading                       | `<news>.locator("h2.newsHeader", { hasText: /^News$/ })`                                                                                              |
307: | News items                         | `<news>.locator(".newsItem")`                                                                                                                         |
308: | Window close button                | `<winbox>.locator(".wb-close")` (scoped per window, not `.first()` page-wide)                                                                         |
309: | Project menu trigger               | `page.locator("[data-slot=navigation-menu-list]").getByRole("button", { name: "Project", exact: true })`                                              |
310: | Open menu content                  | `page.locator("[data-slot=navigation-menu-content]")` (wait for visible after trigger click)                                                          |
311:
312: Notes:
313:
314: - Scope every content assertion to the specific window's `.prose` — never page-wide `getByText`
315:   (locator name collisions: the map window's layer buttons and menu items can contain colliding
316:   strings; see "Locator name collisions" in docs/tests.md).
317: - Do NOT scope to `.winbox.focus` on first load: Winbox moves focus into the last restored window,
318:   so the Mission/News windows are not focused. (`.winbox.focus .wb-title` is only valid after
319:   explicitly focusing a window, e.g. via the Windows dropdown.)
320: - Windows may overlap on small viewports; Playwright visibility is CSS-based (not occlusion), so
321:   DOM-scoped assertions are unaffected. Optionally focus a window first (Windows dropdown → item)
322:   for visual clarity.
323: - Playwright normalizes whitespace, so phrases match even though the backend HTML contains source
324:   line breaks.
325:
326: ---
327:
328: ## 5. Test Execution Matrix
329:
330: | Test ID  | Test case                                          | Suite | Priority | Fragility                                                                                    |
331: | -------- | -------------------------------------------------- | ----- | -------- | -------------------------------------------------------------------------------------------- |
332: | TEXT-001 | Mission window shows loaded text content           | 1.1   | Critical | None (structural: `.prose` presence, indicator absence)                                      |
333: | TEXT-002 | Mission content matches textId vicavMission        | 1.2   | Critical | Content (stable mission-documentation phrases)                                               |
334: | TEXT-003 | News window shows loaded content                   | 1.3   | Critical | None (structural: heading + item existence); news copy volatile — intentionally NOT asserted |
335: | TEXT-004 | Contributors window does not match Mission phrases | 2.1   | High     | Content (absence assertions)                                                                 |
336: | TEXT-005 | Reopening Mission via menu renders same content    | 3.1   | Medium   | Content (same phrases as TEXT-002)                                                           |
337:
338: Browsers: chromium, firefox, webkit (all three desktop projects in playwright.config.ts). Viewport:
339: default desktop (1280x720).
340:
341: ---
342:
343: ## 6. Running the Tests
344:
345: ```bash
346: # .env.local (gitignored) — required, dotenv -e wrapper fails without it
347: NUXT_PUBLIC_API_BASE_URL="https://vicav-dev.acdh.oeaw.ac.at"
348:
349: pnpm run build          # PUBLIC vars are read at server start; rebuild only if code changed
350: pnpm run test:e2e       # all vicav tests (webServer: pnpm run start:local on :3000)
351: pnpm run test:e2e text-window-display   # only this plan's tests
352: ```
353:
354: - Kill any stale server on port 3000 before switching backends
355:   (`webServer.reuseExistingServer: true` locally).
356: - CI: 1 worker, 2 retries, `forbidOnly` on.
357: - Test file header convention: `// spec: specs/text-window-display-test-plan.md` (as in
358:   `e2e/pages/vicav/menu/windows-integration.test.ts`).
359:
360: ---
361:
362: ## 7. Live-Backend Fragility (stable vs volatile)
363:
364: Tests hit the real backend, so they can break when backend **content** changes rather than frontend
365: code (docs/tests.md).
366:
367: | Assertion                                                                      | Stability                                                | Breaks when                                                                      |
368: | ------------------------------------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
369: | Window titles "Mission" / "News" / "All Bibl. Locations on Map"                | Stable                                                   | Project config changes panel windows                                             |
370: | `.prose` rendered, LoadingIndicator gone (TEXT-001, TEXT-003)                  | Stable (structural)                                      | Frontend regression or text fetch failure (retry:false → empty window + spinner) |
371: | News `h2.newsHeader` "News", `.newsItem` count ≥ 1                             | Stable                                                   | News text restructured (classes removed)                                         |
372: | Specific news item copy                                                        | **Volatile** — new items prepended, old removed          | Any news update → therefore NOT asserted                                         |
373: | Mission h2 "Vienna Corpus of Arabic Varieties (VICAV)"                         | Stable (project documentation)                           | Backend rewrites the mission text                                                |
374: | Mission phrases "international endeavour…", "strong methodological component…" | Stable (core mission statement)                          | Backend rewrites the mission text                                                |
375: | TEXT-004 absence assertions                                                    | Stable while vicavContributors keeps its current wording | Contributors text gains the Mission phrases (unlikely)                           |
376:
377: **Triage rule:** if a content assertion fails, first re-verify the live content before assuming a
378: frontend bug:
379:
380: ```bash
381: curl -s -H "Accept: application/xml" "https://vicav-dev.acdh.oeaw.ac.at/vicav/text?id=vicavMission"
382: curl -s -H "Accept: application/xml" "https://vicav-dev.acdh.oeaw.ac.at/vicav/text?id=vicavNews"
383: ```
384:
385: If the phrases are still in the response, the failure is a frontend regression
386: (fetch/render/loading-state); if they are gone, update the spec's phrases to the new stable wording.
387:
388: ---
389:
390: ## 8. Success Criteria
391:
392: - On first load of `/`, both default Text windows (Mission, News) display their text content:
393:   `.prose` rendered, LoadingIndicator gone, no `opacity-50` dimming.
394: - The Mission window's rendered content provably belongs to textId `vicavMission` (unique heading +
395:   two stable body phrases), and a different text (Contributors) provably does not match those
396:   phrases.
397: - The News window renders its stable heading and at least one news item, without coupling the test
398:   to volatile news copy.
399: - (Optional) The Project-menu path reopens Mission with identical content.

(End of file - total 399 lines)
</content>
````

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\specs\\tunocent-menu-test-plan.md"
}
```

**Output:**

````
<path>V:\vicav-vue3\specs\tunocent-menu-test-plan.md</path>
<type>file</type>
<content>
1: # TUNOCENT Test Plan
2:
3: This plan was generated using AI (MiniMax-m2.5) and _kilocode_ using the prompt
4:
5: > Using @playwright-test-planner inspect http://127.0.0.1:3000 and create a third test plan
6: > `specs/tunocent-menu-test-plan.md`.
7:
8: ## Overview
9:
10: This document outlines a comprehensive test plan for the TUNOCENT application - a linguistic
11: research database for Tunisia's Arabic varieties. The application provides access to speaker
12: profiles, linguistic feature lists, sample texts, and corpus texts with geographic visualization
13: capabilities.
14:
15: **Application URL**: http://127.0.0.1:3000 **Backend API**: https://tunocent-api.acdh-dev.oeaw.ac.at
16: **Application Type**: Web-based linguistic research database with windowed interface
17:
18: ---
19:
20: ## Test Objectives
21:
22: 1. **Verify Core Functionality**: Ensure all navigation menus and submenu options work correctly
23: 2. **Validate Data Display**: Confirm data tables and content render correctly for all sections
24: 3. **Test Search & Filter**: Validate search interfaces return accurate results
25: 4. **Verify Map Integration**: Ensure geographic visualizations display correctly
26: 5. **Validate Responsive Design**: Test both desktop and mobile layouts
27: 6. **Verify Imprint Page**: Confirm legal information page loads correctly
28: 7. **Error Handling**: Test edge cases and invalid inputs
29:
30: ---
31:
32: ## Test Scope
33:
34: ### In Scope
35:
36: - Homepage and navigation menu functionality
37: - All seven main menu sections (About, Profiles, Feature Lists, Sample Texts, Corpus Texts, Browse
38:   data, Research)
39: - Submenu options and window opening behavior
40: - Data table rendering and content display
41: - Search and filter forms
42: - Map visualization functionality
43: - Window management (Cascade, Tile, Smart tile, etc.)
44: - Footer and imprint page
45: - Mobile responsive behavior
46:
47: ### Out of Scope
48:
49: - Backend API performance testing
50: - Database integrity (assumed handled by API tests)
51: - Browser-specific rendering bugs outside Chromium/Firefox/WebKit
52: - Third-party service uptime (MapLibre, Matomo analytics)
53:
54: ---
55:
56: ## Test Data Requirements
57:
58: ### Environment Variables
59:
60: ```bash
61: export NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"
62: ```
63:
64: ### Expected Data Counts (for validation)
65:
66: | Data Type     | Expected Count | Description                      |
67: | ------------- | -------------- | -------------------------------- |
68: | Profiles      | 71             | Geography, history, demographics |
69: | Feature Lists | 195            | Grammatical/lexical variation    |
70: | Sample Texts  | 185            | 7 sentences each                 |
71: | Corpus Texts  | 24             | Transcribed narratives           |
72: | Browse Data   | 2,683          | Speakers, locations, data types  |
73:
74: ### Test Accounts
75:
76: - No authentication required (public application)
77:
78: ---
79:
80: ## Priority Ordering
81:
82: ### Priority 1 - Critical (Happy Path)
83:
84: 1. **Homepage Load**
85:    - Verify page loads without errors
86:    - Confirm correct document title
87:    - Verify all main navigation elements visible
88:
89: 2. **Navigation - Menu Access**
90:    - Test all 7 main menu items clickable
91:    - Verify submenu options appear on hover/click
92:    - Confirm windows open with correct content
93:
94: 3. **Data Display - Basic**
95:    - Verify Welcome window displays on load
96:    - Confirm statistics shown correctly
97:
98: 4. **Imprint Page**
99:    - Navigate to /imprint
100:    - Verify page loads correctly
101:
102: ### Priority 2 - High (Core Functionality)
103:
104: 5. **Profiles Section**
105:    - List all entries loads
106:    - Map view displays markers
107:
108: 6. **Feature Lists Section**
109:    - List all feature lists loads
110:    - Map view displays markers
111:    - Search interface accessible
112:
113: 7. **Sample Texts Section**
114:    - List all sample texts loads
115:    - Map view displays markers
116:    - Search interface accessible
117:
118: 8. **Corpus Texts Section**
119:    - List all entries loads
120:    - Search functionality works
121:
122: 9. **Browse Data Section**
123:    - List all recordings loads
124:    - Map view shows locations
125:
126: ### Priority 3 - Medium (Extended Features)
127:
128: 10. **Research Section**
129:     - Publications list loads
130:     - Presentations list loads
131:     - Conference content accessible
132:
133: 11. **Window Management**
134:     - Cascade windows
135:     - Tile windows
136:     - Smart tile arrangement
137:     - Close/minimize/maximize
138:
139: 12. **Search Validation**
140:     - Feature list search returns results
141:     - Sample text search returns results
142:     - Corpus search returns results
143:
144: ### Priority 4 - Low (Edge Cases & Mobile)
145:
146: 13. **Mobile Responsive**
147:     - Hamburger menu works
148:     - Layout adapts correctly
149:
150: 14. **Error Handling**
151:     - Invalid search inputs handled gracefully
152:     - Network timeout handling
153:
154: 15. **Accessibility**
155:     - Skip links work
156:     - Keyboard navigation functional
157:
158: ---
159:
160: ## Test Scenarios
161:
162: ### Suite 1: Homepage & Navigation
163:
164: #### TC-001: Homepage Load
165:
166: - **Steps**:
167:   1. Navigate to http://127.0.0.1:3000
168:   2. Wait for page load
169: - **Expected**: Page loads with title "Home | TUNOCENT - Tunisia's Linguistic terra incognita"
170:
171: #### TC-002: Main Navigation Visible
172:
173: - **Steps**:
174:   1. Load homepage
175:   2. Check for header navigation elements
176: - **Expected**: All 7 menu items visible (About, Profiles, Feature Lists, Sample Texts, Corpus
177:   Texts, Browse data, Research)
178:
179: #### TC-003: Navigation Menu Click
180:
181: - **Steps**:
182:   1. Click on "Profiles" button (main nav uses `getByRole("button")`)
183:   2. Verify dropdown submenu appears
184:   3. Press ArrowDown + Enter to select "List all entries"
185: - **Expected**: Window opens with profiles table
186:
187: #### TC-004: Windows Menu Functionality
188:
189: - **Steps**:
190:   1. Click on "Windows" menu item
191:   2. Verify submenu shows open windows and arrangement options
192: - **Expected**: Menu shows "Welcome to TUNOCENT" and arrangement options (None, Cascade, Tile, Smart
193:   tile, Column 5 Flex)
194:
195: ---
196:
197: ### Suite 2: Data Sections
198:
199: #### TC-005: Profiles - List All Entries
200:
201: - **Steps**:
202:   1. Hover on "Profiles" button
203:   2. Click "List all entries"
204: - **Expected**: Window opens with `<ul>` list content
205:
206: #### TC-006: Profiles - Show on Map
207:
208: - **Steps**:
209:   1. Hover on "Profiles" button
210:   2. Click "Show profiles on map"
211:   3. Window opens with `[data-geo-map]` element visible
212: - **Expected**: Map displays with approximately 72 markers
213:
214: #### TC-007: Feature Lists - List All
215:
216: - **Steps**:
217:   1. Hover on "Feature Lists" button
218:   2. Click "List all feature lists"
219: - **Expected**: Window opens with `<ul>` list content
220:
221: #### TC-008: Feature Lists - Show on Map
222:
223: - **Steps**:
224:   1. Hover on "Feature Lists" button
225:   2. Click "Show feature lists on map"
226:   3. Window opens with `[data-geo-map]` element visible
227: - **Expected**: Map displays with 196 markers
228:
229: #### TC-009: Feature Lists - Search Interface
230:
231: - **Steps**:
232:   1. Hover on "Feature Lists" button
233:   2. Click "Search and compare feature lists"
234: - **Expected**: Search form with labels: Place, Speaker identifier, Age, Sex, Word, Features,
235:   Translation, Comment + Query button
236:
237: #### TC-010: Sample Texts - List All
238:
239: - **Steps**:
240:   1. Hover on "Sample Texts" button
241:   2. Click "List all sample texts"
242: - **Expected**: Window opens with `<ul>` list content
243:
244: #### TC-011: Sample Texts - Show on Map
245:
246: - **Steps**:
247:   1. Hover on "Sample Texts" button
248:   2. Click "Show sample texts on map"
249:   3. Window opens with `[data-geo-map]` element visible
250: - **Expected**: Map displays with markers
251:
252: #### TC-012: Sample Texts - Search Interface
253:
254: - **Steps**:
255:   1. Hover on "Sample Texts" button
256:   2. Click "Search and compare sample texts"
257: - **Expected**: Search form with labels: Place, Speaker identifier, Age, Sex, Word, Sentences,
258:   Comment + Query button
259:
260: #### TC-013: Corpus Texts - List All
261:
262: - **Steps**:
263:   1. Hover on "Corpus Texts" button
264:   2. Click "List all transcribed entries"
265: - **Expected**: Window opens with `<ul>` list content
266:
267: #### TC-014: Corpus Texts - Search
268:
269: - **Steps**:
270:   1. Hover on "Corpus Texts" button
271:   2. Click "Search the corpus"
272: - **Expected**: Search form with text input and "Search for words or enter a CQL query" text
273:
274: #### TC-015: Browse Data - List All
275:
276: - **Steps**:
277:   1. Hover on "Browse data" button
278:   2. Click "List all data recordings"
279: - **Expected**: Window opens with `<table>` or `<ul>` content
280:
281: #### TC-016: Browse Data - Show Locations
282:
283: - **Steps**:
284:   1. Hover on "Browse data" button
285:   2. Click "Show all locations"
286:   3. Window opens with `[data-geo-map]` element visible
287: - **Expected**: Map displays recording locations
288:
289: ---
290:
291: ### Suite 3: Research Section
292:
293: #### TC-017: Research - Publications
294:
295: - **Steps**:
296:   1. Navigate to homepage
297:   2. Click Research > Publications
298: - **Expected**: Publications list window opens
299:
300: #### TC-018: Research - Presentations
301:
302: - **Steps**:
303:   1. Navigate to homepage
304:   2. Click Research > Presentations
305: - **Expected**: Presentations list window opens
306:
307: #### TC-019: Research - Conference
308:
309: - **Steps**:
310:   1. Navigate to homepage
311:   2. Click Research > Conference
312: - **Expected**: Conference information window opens
313:
314: ---
315:
316: ### Suite 4: Window Management
317:
318: #### TC-020: Window Arrangement - Cascade
319:
320: - **Steps**:
321:   1. Open multiple windows
322:   2. Click Windows > Cascade
323: - **Expected**: Windows arranged in overlapping cascade pattern
324:
325: #### TC-021: Window Arrangement - Tile
326:
327: - **Steps**:
328:   1. Open multiple windows
329:   2. Click Windows > Tile
330: - **Expected**: Windows arranged in non-overlapping tile grid
331:
332: #### TC-022: Window Arrangement - Smart Tile
333:
334: - **Steps**:
335:   1. Open multiple windows
336:   2. Click Windows > Smart tile
337: - **Expected**: Windows arranged in optimized smart grid
338:
339: #### TC-023: Window Close
340:
341: - **Steps**:
342:   1. Open a window
343:   2. Click window close button
344: - **Expected**: Window closes
345:
346: ---
347:
348: ### Suite 5: Imprint & Footer
349:
350: #### TC-024: Imprint Page Navigation
351:
352: - **Steps**:
353:   1. Click on "Imprint" link in footer
354: - **Expected**: Navigate to /imprint page
355:
356: #### TC-025: Imprint Page Content
357:
358: - **Steps**:
359:   1. Navigate to /imprint
360:   2. Verify content sections
361: - **Expected**: All legal sections visible (Media Owner, Purpose, Copyright, Data Privacy)
362:
363: #### TC-026: Footer Links
364:
365: - **Steps**:
366:   1. Hover over footer "CONTACT" area
367:   2. Click on "ASK US!" link
368: - **Expected**: Email client opens with mailto:acdh-helpdesk@oeaw.ac.at
369:
370: #### TC-027: Footer DOI Link
371:
372: - **Steps**:
373:   1. Locate DOI link in footer
374:   2. Click on funding DOI
375: - **Expected**: Navigates to https://doi.org/10.55776/P31647
376:
377: ---
378:
379: ### Suite 6: Search Functionality
380:
381: #### TC-028: Feature List Search - Basic
382:
383: - **Steps**:
384:   1. Navigate to Feature Lists > Search and compare feature lists
385:   2. Enter search term in "Word" field
386:   3. Click "Query" button
387: - **Expected**: Search results displayed in table format
388:
389: #### TC-029: Sample Text Search - Basic
390:
391: - **Steps**:
392:   1. Navigate to Sample Texts > Search and compare sample texts
393:   2. Enter search term
394:   3. Click "Query" button
395: - **Expected**: Search results displayed
396:
397: #### TC-030: Corpus Search - Exact Match
398:
399: - **Steps**:
400:   1. Navigate to Corpus Texts > Search the corpus
401:   2. Enter word in "Search for exact words"
402:   3. Click "Query" button
403: - **Expected**: Results displayed with matched context
404:
405: #### TC-031: Corpus Search - CQL Advanced
406:
407: - **Steps**:
408:   1. Navigate to Corpus Texts > Search the corpus
409:   2. Enter CQL query in advanced search
410:   3. Click "Query" button
411: - **Expected**: CQL search results displayed
412:
413: ---
414:
415: ### Suite 7: Mobile Responsive
416:
417: #### TC-032: Mobile Hamburger Menu
418:
419: - **Steps**:
420:   1. Resize viewport to mobile dimensions (< 768px)
421:   2. Click hamburger menu toggle
422: - **Expected**: Mobile menu opens with navigation options
423:
424: #### TC-033: Mobile Navigation
425:
426: - **Steps**:
427:   1. Open mobile menu
428:   2. Click menu item
429: - **Expected**: Submenu appears with options
430:
431: ---
432:
433: ### Suite 8: Error Handling & Edge Cases
434:
435: #### TC-034: Empty Search Results
436:
437: - **Steps**:
438:   1. Navigate to search interface
439:   2. Enter unlikely search term (e.g., "xyzqwerty123")
440:   3. Submit search
441: - **Expected**: Empty results message displayed (not error)
442:
443: #### TC-035: Network Timeout
444:
445: - **Steps**:
446:   1. Throttle network to slow 3G
447:   2. Navigate to data section
448: - **Expected**: Loading indicator shown, then content or error message
449:
450: #### TC-036: Invalid URL
451:
452: - **Steps**:
453:   1. Navigate to http://127.0.0.1:3000/invalid-page-12345
454: - **Expected**: Appropriate error or redirect
455:
456: ---
457:
458: ## Dependencies & Prerequisites
459:
460: ### Environment Requirements
461:
462: 1. **Node.js**: v18+ (for local development)
463: 2. **pnpm**: Package manager
464: 3. **Playwright**: Installed for e2e testing
465: 4. **Backend API**: Must be online (https://tunocent-api.acdh-dev.oeaw.ac.at)
466:
467: ### Starting the Application
468:
469: ```bash
470: # Development mode
471: pnpm run dev
472:
473: # Or for testing
474: pnpm run start:local
475: ```
476:
477: ### Running Tests
478:
479: ```bash
480: # Run all tests
481: NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test
482:
483: # Run specific test file
484: NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test e2e/pages/tunocent/index.spec.ts
485:
486: # Run with UI
487: NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test --ui
488: ```
489:
490: ---
491:
492: ## Test File Structure
493:
494: Recommended test organization:
495:
496: ```
497: e2e/
498: └── pages/
499:     └── tunocent/
500:         ├── home.spec.ts          # Homepage tests
501:         ├── imprint.spec.ts     # Imprint page tests
502:         ├── profiles.spec.ts   # Profiles section tests
503:         ├── feature-lists.spec.ts  # Feature lists tests
504:         ├── sample-texts.spec.ts    # Sample texts tests
505:         ├── corpus-texts.spec.ts  # Corpus texts tests
506:         ├── browse-data.spec.ts   # Browse data tests
507:         ├── research.spec.ts    # Research section tests
508:         ├── search.spec.ts    # Search functionality tests
509:         └── mobile.spec.ts    # Mobile responsive tests
510: ```
511:
512: ---
513:
514: ## Menu Technical Details
515:
516: ## See `../docs/menu.md`
517:
518: ## Notes
519:
520: 1. **Window Timing**: Some windows may take time to load data from API - appropriate waits may be
521:    needed
522: 2. **Map Rendering**: Map snapshots may need visual verification beyond assertions
523: 3. **Data Counts**: Actual counts may vary - tests should use >= or <= assertions where appropriate
524: 4. **Menu Behavior**: Always use `getByRole("button", ...)` for main nav,
525:    `getByRole("menuitem", ...)` for Windows dropdown
526: 5. **Search Autocomplete**: TagsSelect components may need typing delays for dropdown population

(End of file - total 526 lines)
</content>
````

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 72.3s)

_Thinking:_

Next, I'll read the remaining documentation — `windowTypes.md`, `menu.md`, and
`tei-metadata-loading-caching.md` — and check the existing tunocent e2e tests and the project's
openapi.json to find out which windows get opened by default on tunocent.

Now let me read the remaining docs and explore the tunocent setup.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\docs\\windowTypes.md"
}
```

**Output:**

````
<path>V:\vicav-vue3\docs\windowTypes.md</path>
<type>file</type>
<content>
1: # Window Types
2:
3: Implemented `targetType` values are taken from
4: [app/components/window-content.vue](../app/components/window-content.vue), and the shapes below are
5: taken from [app/types/global.ts](../app/types/global.ts).
6:
7: ## Shared helper fields
8:
9: - `TextId`: `{ textId: string }`
10: - `TeiSource`: `{ teiSource: string }`
11: - `ShowCitation`: `{ showCitation: boolean }`
12: - `QueryString`: `{ queryString: string }`
13: - `FeatureValueGroup`: `{ columnId: string; label: string; values: string[] }` — a set of feature
14:   values the user merged into one legend entry and one map marker. Used by `ListMap`.
15:
16: Schemas commonly include `TeiSource` and `ShowCitation` through `.partial()`, which makes those
17: fields optional in the window params documented below.
18:
19: ## Implemented window types
20:
21: ### `WMap`
22:
23: Rendered as [geo-map-window-content.vue](../app/components/geo-map-window-content.vue).
24:
25: - `params`:
26:
27: ```ts
28: {
29:   queryString: string;
30:   title?: string;
31:   endpoint: string;
32:   queryParams?: {
33:     ids?: string;
34:     word?: string;
35:     person?: string;
36:     translation?: string;
37:     comment?: string;
38:     features?: string;
39:     page?: number;
40:     type: "samples" | "lingfeatures";
41:   };
42:   scope?: Array<"reg" | "geo" | "diaGroup">;
43:   hideDefaultLayers?: boolean;
44: }
45: ```
46:
47: - Additional prop passed by `window-content.vue`: `title: props.item.winbox.title`
48:
49: ### `Text`
50:
51: Rendered as [text-window-content.vue](../app/components/text-window-content.vue).
52:
53: - `params`:
54:
55: ```ts
56: {
57:   textId: string;
58:   teiSource?: string;
59:   showCitation?: boolean;
60: }
61: ```
62:
63: ### `SampleText`
64:
65: Rendered as [sample-text-window-content.vue](../app/components/sample-text-window-content.vue).
66:
67: - `params`:
68:
69: ```ts
70: {
71:   textId: string;
72:   teiSource?: string;
73:   showCitation?: boolean;
74: }
75: ```
76:
77: ### `Profile`
78:
79: Rendered as [profile-window-content.vue](../app/components/profile-window-content.vue).
80:
81: - `params`:
82:
83: ```ts
84: {
85:   textId: string;
86:   teiSource?: string;
87:   showCitation?: boolean;
88: }
89: ```
90:
91: ### `Feature`
92:
93: Rendered as [feature-window-content.vue](../app/components/feature-window-content.vue).
94:
95: - `params`:
96:
97: ```ts
98: {
99:   textId: string;
100:   teiSource?: string;
101:   showCitation?: boolean;
102: }
103: ```
104:
105: ### `FeatureStatistics`
106:
107: Rendered as
108: [feature-statistics-window-content.vue](../app/components/feature-statistics-window-content.vue).
109:
110: - `params`:
111:
112: ```ts
113: {
114:   featureId: string;
115:   showCitation?: boolean;
116: }
117: ```
118:
119: ### `FeatureValue`
120:
121: Rendered as [feature-value-window-content.vue](../app/components/feature-value-window-content.vue).
122:
123: - `params`:
124:
125: ```ts
126: {
127:   values: any[];
128:   showCitation?: boolean;
129: }
130: ```
131:
132: ### `Location`
133:
134: Rendered as [location-window-content.vue](../app/components/location-window-content.vue).
135:
136: - `params`:
137:
138: ```ts
139: Row<FeatureType> & {
140:   showCitation?: boolean;
141:   [key: string]: unknown;
142: }
143: ```
144:
145: Where `FeatureType` is:
146:
147: ```ts
148: {
149:   type: "Feature";
150:   id: string;
151:   geometry: {
152:     type: "Point";
153:     coordinates: number[];
154:   };
155:   properties: any;
156: }
157: ```
158:
159: ### `BiblioEntries`
160:
161: Rendered as
162: [biblio-entries-window-content.vue](../app/components/biblio-entries-window-content.vue).
163:
164: - `params`:
165:
166: ```ts
167: {
168:   queryString: string;
169:   xslt?: string;
170:   showMap?: boolean;
171:   isQueryVisible?: boolean; // defaults to false
172: }
173: ```
174:
175: - Event wired by `window-content.vue`: `update-query-param` updates the window query string.
176:
177: ### `DictQuery`
178:
179: Rendered as [dict-query-window-content.vue](../app/components/dict-query-window-content.vue).
180:
181: - `params`:
182:
183: ```ts
184: {
185:   textId: string;
186:   queryParams?: {
187:     q?: string | null;
188:     page?: number | null;
189:     pageSize?: number | null;
190:     id?: string | null;
191:     ids?: string | null;
192:     sort?: "asc" | "desc" | "none" | null;
193:     altLemma?: string | null;
194:     format?: string | null;
195:   };
196:   queryString: string;
197:   queryTemplateTextInput?: string;
198:   queryTemplate?: string;
199:   isTextInputManual?: boolean; // defaults to false
200:   isQueryVisible?: boolean; // defaults to true
201: }
202: ```
203:
204: - Event wired by `window-content.vue`: `update-query-param` updates the window query string.
205:
206: ### `ListMap`
207:
208: Rendered as [geojson-table-window-content.vue](../app/components/geojson-table-window-content.vue).
209:
210: - `params`:
211:
212: ```ts
213: {
214:   queryString: string; // defaults to ""
215:   featureValueGroups?: Array<FeatureValueGroup>;
216: }
217: ```
218:
219: - `featureValueGroups` restores the user's custom feature value groups when the window is opened.
220:   The query string says which values are selected, the groups say which of them share a marker, so a
221:   shared link only reproduces the map if it carries both.
222: - Events wired by `window-content.vue`:
223:   - `update-query-param` updates the window query string.
224:   - `update:params` replaces the window params through the generic validated `updateWindowParams()`
225:     store path, which updates the encoded URL state. Emitted whenever a group is created, renamed,
226:     changed or dissolved.
227:
228: ### `GeojsonMap`
229:
230: Rendered as [geojson-map-window-content.vue](../app/components/geojson-map-window-content.vue).
231:
232: - `params`:
233:
234: ```ts
235: {
236:   url: string;
237:   markerType?: "petal" | "default";
238: }
239: ```
240:
241: ### `CorpusQuery`
242:
243: Rendered as [corpus-query-window-content.vue](../app/components/corpus-query-window-content.vue).
244:
245: - `params`:
246:
247: ```ts
248: {
249: 	queryString: string;
250: }
251: ```
252:
253: ### `CorpusText`
254:
255: Rendered as
256: [corpus-text-json-window-content.vue](../app/components/corpus-text-json-window-content.vue).
257:
258: - `params`:
259:
260: ```ts
261: {
262:   textId: string;
263:   hits?: string;
264:   u?: string;
265:   showCitation?: boolean;
266:   teiSource?: string;
267: }
268: ```
269:
270: ### `DataList`
271:
272: Rendered as [data-list-window-content.vue](../app/components/data-list-window-content.vue).
273:
274: Single-type `CorpusText`, `SampleText`, and `Feature` lists are delegated to specialized
275: searchable/filterable simple-metadata list components. Mixed lists and other data types use the
276: grouped list rendering in `data-list-window-content.vue`.
277:
278: - `params`:
279:
280: ```ts
281: {
282:   dataTypes: Array<
283:     "Profile" | "Text" | "SampleText" | "Feature" | "CorpusText" | "BiblioEntries"
284:   >;
285:   filterListBy?: {
286:     key: string;
287:     value: string;
288:   };
289:   listState?: {
290:     sortMode?: "hit-count" | "alphabetical";
291:     globalFilter?: string;
292:     facets?: Record<string, string[]>;
293:   };
294:   textId?: string;
295: }
296: ```
297:
298: - Event wired by `window-content.vue`: `update:params` replaces the window params through the
299:   generic validated `updateWindowParams()` store path, which updates the encoded URL state.
300:
301: ### `DataTable`
302:
303: Rendered as [data-table-window-content.vue](../app/components/data-table-window-content.vue).
304:
305: - `params`:
306:
307: ```ts
308: {
309:   dataTypes: Array<
310:     "Profile" | "Text" | "SampleText" | "Feature" | "CorpusText" | "BiblioEntries"
311:   >;
312:   filters?: Array<{
313:     key: string;
314:     value: string;
315:   }>;
316:   textId?: string;
317:   teiSource?: string;
318:   showCitation?: boolean;
319: }
320: ```
321:
322: ### `ExploreSamplesForm`
323:
324: Rendered as
325: [explore-samples-form-window-content.vue](../app/components/explore-samples-form-window-content.vue).
326:
327: - `params`:
328:
329: ```ts
330: {
331:   dataTypes: Array<
332:     "Profile" | "Text" | "SampleText" | "Feature" | "CorpusText" | "BiblioEntries"
333:   >;
334:   textId?: string;
335: }
336: ```
337:
338: ### `ExploreSamples`
339:
340: Rendered as
341: [explore-samples-window-content.vue](../app/components/explore-samples-window-content.vue).
342:
343: - `params`:
344:
345: ```ts
346: {
347:   ids?: string;
348:   word?: string;
349:   person?: string;
350:   translation?: string;
351:   comment?: string;
352:   features?: string;
353:   page?: number;
354:   dataType: "SampleText" | "Feature";
355:   region?: string;
356:   settlement?: string;
357:   textId?: string;
358:   showCitation?: boolean;
359: }
360: ```
361:
362: ## Schema And Render Coverage
363:
364: Every `targetType` in the `Schema` discriminated union is currently rendered by
365: [window-content.vue](../app/components/window-content.vue), and every concrete render branch in
366: `window-content.vue` has schema coverage in [app/types/global.ts](../app/types/global.ts).
367:
368: ## Maintenance Prompt
369:
370: Use this prompt after changing window schemas, target types, or `window-content.vue` render
371: branches:
372:
373: ```text
374: Review app/types/global.ts and app/components/window-content.vue.
375: Also review app/stores/use-windows-store.ts for URL/state serialization helpers and generic window
376: param update paths.
377: Update docs/windowTypes.md so it accurately documents the current implemented window targetType
378: values, the component rendered for each targetType, the params shape for each schema, and any
379: additional props or events passed by window-content.vue.
380:
381: Include:
382: - newly added, removed, or renamed targetType values
383: - changed params fields, optional/default behavior, and enum values
384: - params that control initial UI state when opening a window, such as collapsible query visibility
385: - changes to shared helper fields such as TextId, TeiSource, ShowCitation, and QueryString
386: - changed rendered component names, extra props, or emitted events wired in window-content.vue
387: - window params that are persisted to the encoded w= URL state, especially state updated via
388:   updateWindowParams()
389: - schema targetTypes that exist but are not rendered, or rendered branches that lack schema coverage
390:
391: Keep the document concise, table/list driven, and consistent with the existing format. Do not change
392: application code.
393: ```

(End of file - total 393 lines)
</content>
````

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\docs\\menu.md"
}
```

**Output:**

````
<path>V:\vicav-vue3\docs\menu.md</path>
<type>file</type>
<content>
1: # Menu System
2:
3: ## Overview
4:
5: The main navigation menu is dynamically loaded from the backend API based on project configuration.
6: Menu items are rendered differently depending on viewport size.
7:
8: ## Components
9:
10: | Component               | File                                            | Description                       |
11: | ----------------------- | ----------------------------------------------- | --------------------------------- |
12: | AppHeader               | `app/components/app-header.vue`                 | Container, loads menu config      |
13: | AppNavigationMenu       | `app/components/app-navigation-menu.vue`        | Desktop menu (lg breakpoint+)     |
14: | AppNavigationMobileMenu | `app/components/app-navigation-mobile-menu.vue` | Mobile menu (hidden on lg+)       |
15: | WindowListDropdown      | `app/components/window-list-dropdown.vue`       | Windows dropdown (always visible) |
16:
17: ## Menu Data Flow
18:
19: 1. `AppHeader` fetches menu config via `useProjectInfo()` → `data.value.projectConfig.menu.main`
20: 2. Config is passed to `AppNavigationMenu` as `menus` prop
21: 3. User clicks trigger `onSelectMenuItem()` which creates a window via `addWindow()`
22:
23: ## Menu Item Types
24:
25: ```ts
26: type MainItemType = {
27: 	id: string;
28: 	title: string; // Display text (e.g., "Profiles", "Feature Lists")
29: 	item: Array<{
30: 		id: string;
31: 		type: "item" | "separator";
32: 		title?: string; // For type="item"
33: 		targetType: string; // Window type (e.g., "Profile", "DataTable")
34: 		params?: object; // Window parameters
35: 	}>;
36: };
37: ```
38:
39: ## Test Selectors
40:
41: **Desktop menu items are `<button>` elements**, not `<menuitem>`. Use:
42:
43: ```ts
44: // Correct for desktop
45: await page.getByRole("button", { name: "Profiles" }).click();
46:
47: // Windows dropdown uses menuitem
48: await page.getByRole("menuitem", { name: "Windows" }).click();
49: ```
50:
51: The desktop menu uses Reka UI's `NavigationMenu` component, which renders trigger buttons. The
52: Windows dropdown is a separate `WindowListDropdown` component that uses standard menubar/menuitem
53: roles.
54:
55: ## Testing Navigation
56:
57: **Revealing dropdowns**: Hover over the button, then click the menu item. Click alone doesn't reveal
58: the dropdown reliably.
59:
60: ```ts
61: // Hover to reveal dropdown
62: await page.getByRole("button", { name: "Profiles" }).hover();
63: await page.waitForTimeout(500);
64: // Click the specific menu item
65: await page.getByText("List all entries").click();
66: ```
67:
68: **Menu item names** (exact text; these examples are tunocent-derived — for the vicav item names, see
69: `specs/menu-test-plan.md` §1):
70:
71: - Profiles: "List all entries", "Show profiles on map"
72: - Feature Lists: "List all feature lists", "Show feature lists on map", "Search and compare feature
73:   lists"
74: - Sample Texts: "List all sample texts", "Show sample texts on map", "Search and compare sample
75:   texts"
76: - Corpus Texts: "List all transcribed entries", "Search the corpus"
77: - Browse data: "List all data recordings", "Show all locations"
78:
79: **Targeting windows**: Use `.winbox` selector. Get newest window:
80:
81: ```ts
82: async function getNewestWindow(page) {
83: 	await page.waitForTimeout(500);
84: 	const windows = await page.locator(".winbox").all();
85: 	return windows[windows.length - 1];
86: }
87: ```
88:
89: **Content verification patterns**:
90:
91: - List views: `winbox.locator("ul")`
92: - Map views: `winbox.locator("[data-geo-map]")`
93: - Search forms: `winbox.getByText("FieldName", { exact: true })` or
94:   `winbox.getByRole("button", { name: "Query" })`

(End of file - total 94 lines)
</content>
````

**Tool: glob**

**Input:**

```json
{
	"pattern": "e2e/pages/tunocent/**/*"
}
```

**Output:**

```
V:\vicav-vue3\e2e\pages\tunocent\window-management.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\search.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\research.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\mobile.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\index.test.ts
V:\vicav-vue3\e2e\pages\tunocent\imprint.test.ts
V:\vicav-vue3\e2e\pages\tunocent\imprint-footer.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\home.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\explore-profiles-map.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\error-handling.spec.ts
V:\vicav-vue3\e2e\pages\tunocent\data-sections.spec.ts
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 32.3s)

_Thinking:_

Alright, let's check tunocent's index.test.ts and home.spec.ts to understand the current tests, and
check the project's openapi.json to find out which windows are opened by default on tunocent. Also,
let's take a look at text-window-content.vue to understand the rendering.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\e2e\\pages\\tunocent\\index.test.ts"
}
```

**Output:**

```
<path>V:\vicav-vue3\e2e\pages\tunocent\index.test.ts</path>
<type>file</type>
<content>
1: import { expect, test } from "@playwright/test";
2:
3: test.describe("home page", () => {
4: 	test("should have document title", async ({ page }) => {
5: 		await page.goto("/");
6: 		await expect(page).toHaveTitle(
7: 			"Home | TUNOCENT - Tunisia’s Linguistic terra incognita: An Investigation into the Arabic Varieties of Northwestern and Central Tunisia",
8: 		);
9: 	});
10:
11: 	test("should show initial windows", async ({ page }) => {
12: 		await page.goto("/");
13: 		await expect(
14: 			page
15: 				.locator("div")
16: 				.filter({ hasText: /^Welcome to TUNOCENT$/ })
17: 				.nth(1),
18: 		).toBeVisible();
19: 	});
20:
21: 	test("should open window menu with appropriate entries", async ({ page }) => {
22: 		await page.goto("/");
23: 		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
24: 		await page.getByRole("menuitem", { name: "Windows" }).click();
25: 		await expect(page.getByRole("menuitem", { name: "Welcome to TUNOCENT" })).toBeVisible();
26: 	});
27:
28: 	test("should show footer bar with imprint link", async ({ page }) => {
29: 		await page.goto("/");
30: 		await expect(page.getByRole("link", { name: "Imprint" })).toBeVisible();
31: 	});
32:
33: 	test("should open extended footer", async ({ page }) => {
34: 		await page.goto("/");
35: 		await page
36: 			.getByRole("contentinfo")
37: 			.locator("div")
38: 			.filter({ hasText: "© 2026 ACDH |Imprint|" })
39: 			.locator("div")
40: 			.first()
41: 			.hover();
42: 		await expect(page.getByText("CONTACT")).toBeVisible();
43: 	});
44: });

(End of file - total 44 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\e2e\\pages\\tunocent\\home.spec.ts"
}
```

**Output:**

```
<path>V:\vicav-vue3\e2e\pages\tunocent\home.spec.ts</path>
<type>file</type>
<content>
1: import { expect, test } from "@playwright/test";
2:
3: test.describe("Homepage & Navigation", () => {
4: 	test.beforeEach(async ({ page }) => {
5: 		await page.goto("/");
6: 		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
7: 	});
8:
9: 	test("TC-001: Homepage Load", async ({ page }) => {
10: 		await expect(page).toHaveTitle(/TUNOCENT/);
11: 	});
12:
13: 	test("TC-002: Main Navigation Visible", async ({ page }) => {
14: 		await expect(page.getByRole("menubar")).toBeVisible();
15:
16: 		const menuItems = [
17: 			"About",
18: 			"Profiles",
19: 			"Feature Lists",
20: 			"Sample Texts",
21: 			"Corpus Texts",
22: 			"Browse data",
23: 			"Research",
24: 		];
25:
26: 		for (const item of menuItems) {
27: 			await expect(page.getByRole("button", { name: item })).toBeVisible();
28: 		}
29: 	});
30:
31: 	test("TC-003: Navigation Menu Click", async ({ page }) => {
32: 		await page.getByRole("button", { name: "Profiles" }).click();
33:
34: 		await page.getByRole("button", { name: "Feature Lists" }).hover();
35:
36: 		await expect(page.locator(".window, [class*='window']").first()).toBeVisible();
37: 	});
38:
39: 	test("TC-004: Windows Menu Click", async ({ page }) => {
40: 		await page.getByRole("menuitem", { name: /^Windows/ }).click();
41:
42: 		await expect(page.getByRole("menuitem", { name: /^Windows/ })).toBeVisible();
43: 	});
44: });

(End of file - total 44 lines)
</content>
```

**Tool: glob**

**Input:**

```json
{
	"pattern": "app/assets/*.json"
}
```

**Output:**

```
V:\vicav-vue3\app\assets\mapStyles.json
V:\vicav-vue3\app\assets\openapi.json
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 13.6s)

_Thinking:_

Next, I'll check openapi.json to find the default windows for tunocent (the "panel" windows that get
restored on initial load), and check text-window-content.vue to understand the rendering.

**Tool: bash**

**Input:**

```json
{
	"command": "rg -n \"tunocent|panel|textId\" app/assets/openapi.json | head -80"
}
```

**Output:**

```
/usr/bin/bash: line 1: rg: command not found

```

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\app\\components\\text-window-content.vue"
}
```

**Output:**

```
<path>V:\vicav-vue3\app\components\text-window-content.vue</path>
<type>file</type>
<content>
1: <script lang="ts" setup>
2: import type { TextWindowItem } from "@/types/global.ts";
3:
4: interface Props {
5: 	params: TextWindowItem["params"];
6: }
7:
8: const props = defineProps<Props>();
9: const { params } = toRefs(props);
10: const queryParams = computed(() => {
11: 	return {
12: 		textId: params.value.textId,
13: 	};
14: });
15: const { data, isPending, isPlaceholderData } = useTextById(queryParams);
16: const openNewWindowFromAnchor = useAnchorClickHandler();
17:
18: const isLoading = computed(() => {
19: 	return isPending.value || isPlaceholderData.value;
20: });
21: </script>
22:
23: <template>
24: 	<div
25: 		class="relative isolate grid size-full overflow-auto"
26: 		:class="{ 'opacity-50 grayscale': isLoading }"
27: 	>
28: 		<div v-if="params.showCitation">
29: 			<Citation type="software" />
30: 		</div>
31: 		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
32: 		<div v-if="data" class="prose max-w-3xl p-8" @click="openNewWindowFromAnchor" v-html="data" />
33:
34: 		<Centered v-if="isLoading">
35: 			<LoadingIndicator />
36: 		</Centered>
37: 	</div>
38: </template>
39:
40: <style>
41: @reference "@/styles/index.css";
42: /* stylelint-disable selector-class-pattern, block-no-empty */
43: .tbHeader {
44: 	@apply w-full m-0;
45: }
46:
47: .imgIllustration {
48: 	@apply float-right h-[100px] m-[5px];
49: }
50:
51: .aVicText {
52: 	@apply text-primary bg-transparent no-underline cursor-pointer;
53: }
54:
55: .aVicText:hover {
56: 	@apply bg-primary text-on-primary cursor-pointer;
57: }
58:
59: .info-block-wrap > .aVicText {
60: 	@apply text-[#335175];
61: }
62:
63: .newsHeader {
64: 	@apply bg-primary text-on-primary pb-[5px] pl-5;
65: }
66:
67: .newsItem {
68: 	@apply bg-on-primary border-primary mt-0.5 pt-0.5 pl-[5px] border-dotted border;
69: }
70:
71: .dvContributor p {
72: 	@apply flex flex-row justify-between items-start py-2.5 px-[5px];
73: }
74:
75: .dvContributor p span {
76: 	@apply basis-[460px];
77: }
78:
79: .dvContributor p img {
80: 	@apply w-[100px] h-[100px] p-[5px] rounded-[50%];
81: }
82:
83: .tbQueryExamples {
84: 	@apply w-full border-collapse;
85: }
86:
87: .tdQuery {
88: 	@apply bg-on-primary border-primary border-solid border align-top pr-[5px] pl-[5px];
89: }
90:
91: .tdCommentSpan {
92: }
93: </style>

(End of file - total 93 lines)
</content>
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 12.6s)

_Thinking:_

rg isn't available. Let me use grep instead to search for tunocent panel windows in openapi.json.

**Tool: grep**

**Input:**

```json
{
	"pattern": "tunocent",
	"path": "V:\\vicav-vue3\\app\\assets\\openapi.json"
}
```

**Output:**

```
No files found
```

**Tool: grep**

**Input:**

```json
{
	"pattern": "\"panel\"",
	"path": "V:\\vicav-vue3\\app\\assets\\openapi.json"
}
```

**Output:**

```
No files found
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 11.9s)

_Thinking:_

The openapi.json in app/assets doesn't mention tunocent. The vicav test plan states
"app/assets/openapi.json lines 112-152" for vicav's panel windows. Let me check the structure of
openapi.json and see how the per-backend project settings work. Maybe there are multiple openapi
files, or the project settings are fetched from the backend. I'll take a look at the file.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\app\\assets\\openapi.json",
	"limit": 100
}
```

**Output:**

```
<path>V:\vicav-vue3\app\assets\openapi.json</path>
<type>file</type>
<content>
1: {
2:   "openapi": "3.1.0",
3:   "jsonSchemaDialect": "https://spec.openapis.org/oas/3.1/dialect/base",
4:   "servers": [
5:     {
6:       "url": "http://localhost:8984",
7:       "description": "local development"
8:     },
9:     {
10:       "url": "https://vicav.acdh.oeaw.ac.at",
11:       "description": "current VICAV prod server"
12:     },
13:     {
14:       "url": "https://vicav-dev.acdh.oeaw.ac.at",
15:       "description": "current VICAV dev server"
16:     },
17:     {
18:       "url": "https://tunocent-api.acdh-dev.oeaw.ac.at",
19:       "description": "current tunocent dev server"
20:     },
21:     {
22:       "url": "https://tunocent-api.acdh.oeaw.ac.at",
23:       "description": "current tunocent prod server"
24:     },
25:     {
26:       "url": "https://shawi-api.acdh.oeaw.ac.at",
27:       "description": "current shawi prod server"
28:     },
29:     {
30:       "url": "https://shawi-api.acdh-dev.oeaw.ac.at",
31:       "description": "current shawi dev server"
32:     },
33:     {
34:       "url": "https://wibarab-api.acdh-ch-dev.oeaw.ac.at",
35:       "description": "current WIBARAB dev server"
36:     },
37:     {
38:       "description": "SwaggerHub API Auto Mocking",
39:       "url": "https://virtserver.swaggerhub.com/ctot-nondef/Vicav/1.0.0"
40:     }
41:   ],
42:   "info": {
43:     "description": "This is the currently implemented vicav API",
44:     "version": "1.0.0",
45:     "title": "Current Vicav API",
46:     "contact": {
47:       "email": "christoph.hoffmann@oeaw.ac.at"
48:     },
49:     "license": {
50:       "name": "MIT",
51:       "url": "https://opensource.org/licenses/MIT"
52:     }
53:   },
54:   "tags": [
55:     {
56:       "name": "noauth",
57:       "description": "Operations available without authentication"
58:     },
59:     {
60:       "name": "vicav",
61:       "description": "VICAV API An API for retrieving the various VICAV TEI documents rendered either as XHTML snippets or JSON"
62:     },
63:     {
64:       "name": "vleserver-api",
65:       "description": "API Problem and JSON HAL based API for querying dictionary like XML datasets."
66:     }
67:   ],
68:   "paths": {
69:     "/vicav/project": {
70:       "get": {
71:         "description": "Get info about the project, menus and open panels/windows",
72:         "tags": [
73:           "noauth"
74:         ],
75:         "summary": "gets basic project configuration",
76:         "operationId": "getProject",
77:         "responses": {
78:           "200": {
79:             "description": "an xml with wrapped html contained",
80:             "content": {
81:               "application/json": {
82:                 "schema": {
83:                   "$ref": "#/components/schemas/ProjectConfig"
84:                 },
85:                 "examples": {
86:                   "project_config_VICAV": {
87:                     "summary": "the VICAV project configuration",
88:                     "value": {
89:                       "projectConfig": {
90:                         "cached": true,
91:                         "baseURIPublic": "https://vicav-dev.acdh.oeaw.ac.at//vicav",
92:                         "partners": [],
93:                         "funders": [],
94:                         "space": "preserve",
95:                         "id": "vicav_config_vicav",
96:                         "title": "VICAV3.0 - Vienna Corpus of Arabic Varieties",
97:                         "logo": {
98:                           "img": "https://vicav-dev.acdh.oeaw.ac.at//vicav/images/vicav_logo.svg"
99:                         },
100:                         "icon": "https://vicav-dev.acdh.oeaw.ac.at//vicav/vendor/images/marker-icon.png",

(Showing lines 1-100 of 12919. Use offset=101 to continue.)
</content>
```

**Tool: grep**

**Input:**

```json
{
	"pattern": "panel",
	"path": "V:\\vicav-vue3\\app",
	"include": "*.{ts,vue,json}"
}
```

**Output:**

```
Found 47 matches
V:\vicav-vue3\app\assets\openapi.json:
  Line 71:         "description": "Get info about the project, menus and open panels/windows",

  Line 112:                         "panel": [

  Line 2070:                         "panel": [],

  Line 2175:                         "style": "\n.navbar, .main-footer {\n\tbackground-color: #7C633F;\n}\n.sub-nav, .panel-chrome, .footer-imprint-bar {\n\tbackground-color: #FFA500;\n}\n\n.main-footer a {\n\tcolor: gold;\n}\n\na.navbar-brand {\n\tfont-size: 2.5em;\n\tfont-family: Times, serif;\n\tfont-style: [...]",

  Line 2983:                     "value": "<project>\n  <config>\n    <projectConfig xml:space=\"preserve\" id=\"vicav_config_vicav\">\n  <title>VICAV3.0 - Vienna Corpus of Arabic Varieties</title>\n  <logo><img src=\"images/vicav_logo.svg\"/></logo>\n  <frontpage method=\"geo\">\n    <param>.*</param>\n    <param>geo</param>\n    <panel type=\"text\" target=\"li_vicavMission\">MISSION</panel>\n    <panel type=\"text\" target=\"li_vicavNews\">NEWS</panel>\n  </frontpage>\n  <menu>\n    <main>\n      <dropdown xml:id=\"dropdown00\" title=\"Project\">\n        <item xml:id=\"li_vicavMission\">Mission</item>\n        <item xml:id=\"li_vicavNews\">News</item>\n        <separator/>\n        <item xml:id=\"li_vicavTypesOfText\">Types of Text/Data</item>\n        <item xml:id=\"li_vicavContributors\">Contributors</item>\n        <item xml:id=\"li_vicavLinguistics\">Linguistics</item>\n      </dropdown>\n    </main>\n    <subnav>\n      <item xml:id=\"subNavBiblGeoMarkers\" class=\"active\">Bibl. Locations</item>\n    </subnav>\n  </menu>\n</projectConfig>\n  </config>\n  <renderedMenu>\n    <menu xmlns=\"http://www.w3.org/1999/xhtml\">\n      <main>\n        <ul class=\"navbar-nav mr-auto\">\n          <li class=\"nav-item dropdown\">\n            <a class=\"nav-link dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\" id=\"dropdown00\">Project</a>\n            <div class=\"dropdown-menu\" aria-labelledby=\"dropdown00\">\n              <a class=\"dropdown-item\" id=\"li_vicavMission\">Mission</a>\n              <a class=\"dropdown-item\" id=\"li_vicavNews\">News</a>\n              <div class=\"dropdown-divider\"/>\n              <a class=\"dropdown-item\" id=\"li_vicavTypesOfText\">Types of Text/Data</a>\n              <a class=\"dropdown-item\" id=\"li_vicavContributors\">Contributors</a>\n              <a class=\"dropdown-item\" id=\"li_vicavLinguistics\">Linguistics</a>\n            </div>\n          </li>\n        </ul>\n      </main>\n      <su...
  Line 6146:           "panel": {

  Line 6405:             "summary": "An ID for the target panel/window that this UI item opens or brings to the front"

  Line 6419:               "panel",

  Line 6453:             "summary": "The caption (or part of it) for the target panel/window that this UI item opens or brings to the front"


V:\vicav-vue3\app\stores\use-windows-store.ts:
  Line 62: 		return data.value?.projectConfig?.panel ?? [];


V:\vicav-vue3\app\lib\api-client\index.ts:
  Line 216:   panel?: ItemType[];

  Line 301:   type: "panel" | "item" | "separator" | "dropdown";

  Line 2119:      * @description Get info about the project, menus and open panels/windows


V:\vicav-vue3\app\components\app-navigation-mobile-menu.vue:
  Line 16: const isSidepanelOpen = ref(false);

  Line 19: 	isSidepanelOpen.value = false;

  Line 37: 	<Sheet v-model:open="isSidepanelOpen">


V:\vicav-vue3\app\components\ui\icon-picker\icons-data.ts:
  Line 4009: 			"panel",

  Line 5086: 			"panels",

  Line 6691: 		name: "inspection-panel",

  Line 6934: 		name: "layout-panel-left",

  Line 6939: 		name: "layout-panel-top",

  Line 8024: 			"control panel",

  Line 8662: 		name: "panel-bottom-close",

  Line 8667: 		name: "panel-bottom-dashed",

  Line 8672: 		name: "panel-bottom-open",

  Line 8677: 		name: "panel-bottom",

  Line 8682: 		name: "panel-left-close",

  Line 8687: 		name: "panel-left-dashed",

  Line 8692: 		name: "panel-left-open",

  Line 8697: 		name: "panel-left",

  Line 8702: 		name: "panel-right-close",

  Line 8707: 		name: "panel-right-dashed",

  Line 8712: 		name: "panel-right-open",

  Line 8717: 		name: "panel-right",

  Line 8722: 		name: "panel-top-close",

  Line 8727: 		name: "panel-top-dashed",

  Line 8732: 		name: "panel-top-open",

  Line 8737: 		name: "panel-top",

  Line 8742: 		name: "panels-left-bottom",

  Line 8747: 		name: "panels-right-bottom",

  Line 8752: 		name: "panels-top-left",

  Line 9866: 			"panel",

  Line 11494: 		tags: ["back", "menu", "panel"],

  Line 11499: 		tags: ["back", "previous", "less than", "fewer", "menu", "panel", "button", "keyboard", "<"],

  Line 11510: 			"panel",

  Line 11536: 			"panel",

  Line 11679: 		tags: ["bars", "navigation", "hamburger", "options", "menu bar", "panel"],

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 25.1s)

_Thinking:_

The example in openapi.json is for VICAV, not tunocent. The tunocent project configuration is
fetched from the live backend `https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/project`. Let me check
the panel section around lines 112-152 of openapi.json to understand the structure, then query the
live tunocent backend to find out which windows are the default panels.

First I'll check the panel structure on lines 112-152, then curl the tunocent backend.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\app\\assets\\openapi.json",
	"offset": 100,
	"limit": 80
}
```

**Output:**

```
<path>V:\vicav-vue3\app\assets\openapi.json</path>
<type>file</type>
<content>
100:                         "icon": "https://vicav-dev.acdh.oeaw.ac.at//vicav/vendor/images/marker-icon.png",
101:                         "map": {
102:                           "zoom": 4,
103:                           "center": {
104:                             "lat": 19.064,
105:                             "lng": 24.544
106:                           }
107:                         },
108:                         "param": [
109:                           ".*",
110:                           "geo"
111:                         ],
112:                         "panel": [
113:                           {
114:                             "id": "li_vicavMission",
115:                             "target": "vicavMission",
116:                             "title": "Mission",
117:                             "type": "item",
118:                             "targetType": "Text",
119:                             "label": "Mission",
120:                             "params": {
121:                               "textId": "vicavMission",
122:                               "teiSource": "https://github.com/acdh-oeaw/vicav-content/tree/66c42ebbcd1da3d5787eadb0f40ac0ec7265dc16/vicav_texts/vicav_mission.xml"
123:                             }
124:                           },
125:                           {
126:                             "id": "li_vicavNews",
127:                             "target": "vicavNews",
128:                             "title": "News",
129:                             "type": "item",
130:                             "targetType": "Text",
131:                             "label": "VICAV News",
132:                             "params": {
133:                               "textId": "vicavNews",
134:                               "teiSource": "https://github.com/acdh-oeaw/vicav-content/tree/66c42ebbcd1da3d5787eadb0f40ac0ec7265dc16/vicav_texts/vicav_news.xml"
135:                             }
136:                           },
137:                           {
138:                             "id": "navBiblGeoMarkers",
139:                             "target": "BiblGeoMarkers",
140:                             "title": "All Bibl. Locations on Map",
141:                             "type": "item",
142:                             "targetType": "WMap",
143:                             "label": "All Bibl. Locations on Map",
144:                             "params": {
145:                               "endpoint": "bibl_markers_tei",
146:                               "queryString": ".*",
147:                               "scope": [
148:                                 "geo"
149:                               ]
150:                             }
151:                           }
152:                         ],
153:                         "menu": {
154:                           "main": [
155:                             {
156:                               "id": "dropdown00",
157:                               "target": "dropdown00",
158:                               "title": "Project",
159:                               "item": [
160:                                 {
161:                                   "id": "li_vicavMission",
162:                                   "target": "vicavMission",
163:                                   "title": "Mission",
164:                                   "type": "item",
165:                                   "targetType": "Text",
166:                                   "label": "Mission",
167:                                   "params": {
168:                                     "textId": "vicavMission",
169:                                     "teiSource": "https://github.com/acdh-oeaw/vicav-content/tree/66c42ebbcd1da3d5787eadb0f40ac0ec7265dc16/vicav_texts/vicav_mission.xml"
170:                                   }
171:                                 },
172:                                 {
173:                                   "id": "li_vicavNews",
174:                                   "target": "vicavNews",
175:                                   "title": "News",
176:                                   "type": "item",
177:                                   "targetType": "Text",
178:                                   "label": "VICAV News",
179:                                   "params": {

(Showing lines 100-179 of 12919. Use offset=180 to continue.)
</content>
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 19.9s)

_Thinking:_

The openapi.json sample is VICAV-specific. In the case of tunocent, the project configuration
(including the panel window) is retrieved from the live backend. Let me try querying the live
tunocent backend to get the project configuration.

The openapi.json example is VICAV-specific. For tunocent, the panel windows come from the live
backend. Let me query it.

**Tool: bash**

**Input:**

```json
{
	"command": "curl -s \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/project\" -H \"Accept: application/json\" -o /tmp/tunocent_project.json && wc -c /tmp/tunocent_project.json",
	"timeout": 60000
}
```

**Output:**

```
16169827 /tmp/tunocent_project.json

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 11.0s)

_Thinking:_

The response is large (16MB — probably includes renderedMenu and such). Let me extract the panel
section. I'll use python or node to parse the JSON.

**Tool: bash**

**Input:**

```json
{
	"command": "node -e \"\nconst fs = require('fs');\nconst j = JSON.parse(fs.readFileSync('/tmp/tunocent_project.json','utf8'));\nconst pc = j.projectConfig || j;\nconsole.log('title:', pc.title);\nconsole.log('panel:');\nconsole.log(JSON.stringify(pc.panel, null, 2));\nconsole.log('menu main titles:', (pc.menu?.main||[]).map(m=>m.title).join(', '));\n\"",
	"timeout": 60000
}
```

**Output:**

```
node:fs:440
    return binding.readFileUtf8(path, stringToFlags(options.flag));
                   ^

Error: ENOENT: no such file or directory, open 'V:\tmp\tunocent_project.json'
    at Object.readFileSync (node:fs:440:20)
    at [eval]:3:25
    at runScriptInThisContext (node:internal/vm:219:10)
    at node:internal/process/execution:451:12
    at [eval]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:449:60)
    at evalFunction (node:internal/process/execution:283:30)
    at evalTypeScript (node:internal/process/execution:295:3)
    at node:internal/main/eval_string:71:3 {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'V:\\tmp\\tunocent_project.json'
}

Node.js v24.14.1

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 16.4s)

_Thinking:_

/tmp is mapped to V:\tmp in this Windows bash. Let's use an appropriate temp directory.

**Tool: bash**

**Input:**

```json
{
	"command": "curl -s \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/project\" -H \"Accept: application/json\" -o \"$TEMP/tunocent_project.json\" && node -e \"\nconst fs = require('fs');\nconst os = require('os');\nconst j = JSON.parse(fs.readFileSync(os.tmpdir()+'/tunocent_project.json','utf8'));\nconst pc = j.projectConfig || j;\nconsole.log('title:', pc.title);\nconsole.log('panel:');\nconsole.log(JSON.stringify(pc.panel, null, 2));\nconsole.log('menu main titles:', (pc.menu?.main||[]).map(m=>m.title).join(', '));\n\"",
	"timeout": 90000
}
```

**Output:**

```
title: TUNOCENT - Tunisia’s Linguistic terra incognita: An Investigation into the Arabic Varieties of Northwestern and Central Tunisia
panel:
[
  {
    "id": "tunocentWelcome",
    "target": "tunocentOpeningPage",
    "title": "Welcome to TUNOCENT",
    "type": "item",
    "targetType": "Text",
    "label": "Welcome to TUNOCENT",
    "params": {
      "textId": "tunocentOpeningPage",
      "teiSource": "https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74ca0fe60516ebd3efa1085206/vicav_texts/tunocent_opening_page.xml"
    }
  }
]
menu main titles: About, Profiles, Feature Lists, Sample Texts, Corpus Texts, Browse data, Research

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 15.2s)

_Thinking:_

The default panel window for tunocent is a single "Welcome to TUNOCENT" window, with targetType Text
and textId `tunocentOpeningPage`.

Next, I need to fetch the actual text content of `tunocentOpeningPage` from the live backend and
find a few stable lines/phrases that can be used to verify that the correct text has been loaded.

Let's try fetching `GET /vicav/text?id=tunocentOpeningPage` with `Accept: application/xml`.

I found that the default tunocent window is "Welcome to TUNOCENT" (textId `tunocentOpeningPage`).
Now I'll fetch its content to identify stable phrases.

**Tool: bash**

**Input:**

```json
{
	"command": "curl -s \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocentOpeningPage\" -H \"Accept: application/xml\" -o \"$TEMP/tunocent_opening.xml\" && wc -c \"$TEMP/tunocent_opening.xml\"",
	"timeout": 60000
}
```

**Output:**

```
1925 /tmp/tunocent_opening.xml

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 13.1s)

_Thinking:_

The file was written to /tmp (bash's temporary directory) — but the earlier node read failed because
it was looking for V:\tmp. Let me check where $TEMP is pointing to, and try reading the file.

**Tool: bash**

**Input:**

```json
{
	"command": "echo \"TEMP=$TEMP\"; ls -la \"$TEMP\" | head; cat \"$TEMP/tunocent_opening.xml\"",
	"timeout": 30000
}
```

**Output:**

```
TEMP=/tmp
total 217705
drwxr-xr-x 1 simar 197609        0 Sep  2 23:55 .
drwxr-xr-x 1 simar 197609        0 Jan 20  2024 ..
-rwxr-xr-x 1 simar 197609  3786120 Aug 28 11:34 .bdefff7ffe637fac-00000000.dll
-rwxr-xr-x 1 simar 197609  3786120 Sep  2 23:09 .bdfb9d7fee6f5ffc-00000000.dll
-rwxr-xr-x 1 simar 197609  3786120 Sep  2 21:27 .bdfb9febcf739fdc-00000000.dll
-rwxr-xr-x 1 simar 197609  3786120 Aug 30 20:51 .bdfbb9effefbffbc-00000000.dll
-rwxr-xr-x 1 simar 197609  3786120 Aug 30 20:50 .bdfbb9ffcfe79f9c-00000000.dll
-rwxr-xr-x 1 simar 197609  3786120 Aug 30 21:05 .bdfbbbffee7f1fac-00000000.dll
-rwxr-xr-x 1 simar 197609  3786120 Aug 30 21:30 .bdfbbd7fceffdf9c-00000000.dll

<div xmlns="http://www.w3.org/1999/xhtml">

   <h2>The TUNOCENT project</h2>


   <p><b>About</b> … team members, news section: learn about the TUNOCENT-project, its team members
      and activities</p>




   <p> <b>71 Profiles </b>… geography, history and most notable sights of the research locations; demographics,
      the inhabitants’ prevalent way of life
      and main means of income: get an impression of the different localities; get an insight
      into the way people live by viewing the photos
      </p>


   <p><b>195 Feature lists </b>… a questionnaire that focuses on grammatical and lexical variation: get an impression
      of a specific variety;
      compare the linguistic features in various locations; filter the data by a number
      of categories, such as place, feature, and speaker </p>


   <p><b>185 Sample texts </b> … a text with seven sentences which provide details on everyday activities and duties:

      compare linguistic characteristics contained in the texts; filter the data by a number
      of categories, such as place, sentence number, and speaker</p>


   <p><b>24 Corpus texts</b> … transcribed narratives, ethnographic texts and conversations: read the texts and
      search for words within the corpus texts;
      listen to selected texts </p>


   <p><b>Browse data </b>(with 2683 entries) … data list with speakers and the details of locations and data
      type:
      get an impression of the immense amount of linguistic data we collected; filter the
      list of speakers and recordings by a number of categories, such as place, age, gender
      and data type </p>


   <p><b>Research</b> … lists with publications, presentations and the conference we organised; get an
      impression of our research activities
      and the various topics we addressed</p>


   </div>


```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 174.5s)

_Thinking:_

Got the full content of the tunocentOpeningPage text. Next, let me check how `useTextById` fetches
and what the response looks like (HTML rendering). Let me check the composable.

Also, I need to pick a few stable phrases. The content is as follows:

1. `<h2>The TUNOCENT project</h2>` — heading, unique
2. `<p><b>About</b> … team members, news section: learn about the TUNOCENT-project, its team members and activities</p>`
3. `<p> <b>71 Profiles </b>… geography, history and most notable sights of the research locations; ...`
4. `<p><b>195 Feature lists </b>… a questionnaire that focuses on grammatical and lexical variation: ...`
5. `<p><b>185 Sample texts </b> … a text with seven sentences which provide details on everyday activities and duties: ...`
6. `<p><b>24 Corpus texts</b> … transcribed narratives, ethnographic texts and conversations: ...`
7. `<p><b>Browse data </b>(with 2683 entries) … data list with speakers and the details of locations and data type: ...`
8. `<p><b>Research</b> … lists with publications, presentations and the conference we organised; ...`

Note: the numbers (71, 195, 185, 24, 2683) match the "Expected Data Counts" in the tunocent test
plan. These could be somewhat volatile if the corpus grows, but they're part of the welcome page
documentation. The most stable phrases are:

- Heading: "The TUNOCENT project" (h2)
- "learn about the TUNOCENT-project, its team members" — stable
- "a questionnaire that focuses on grammatical and lexical variation" — stable
- "transcribed narratives, ethnographic texts and conversations" — stable

Note that the HTML has bold tags inside: `<b>About</b> … team members...`. When using getByText with
a phrase that spans across `<b>` elements, the text is split across multiple elements. Playwright's
getByText matches against the text content of an element, but when a phrase straddles element
boundaries (e.g., "About … team members" where "About" is inside `<b>` and the rest is in the
`<p>`), a plain `getByText` against the paragraph may not match. This is because the text content of
the `<p>` element is "About … team members, news section: learn about..." — actually, Playwright's
getByText does match against the full text content of an element (the element's textContent),
normalizing whitespace. Let me think carefully.

Playwright's `getByText` matches elements whose text content contains the given string (after
whitespace normalization). For the `<p>` element, textContent = "About … team members, news section:
learn about the TUNOCENT-project, its team members and activities". So
`getByText("learn about the TUNOCENT-project")` would match the `<p>` element (which contains that
substring). Yes, this works — getByText matches against the element's text content (including
descendants).

However, there's a subtlety: the "…" character and line breaks. Playwright normalizes whitespace
(collapsing newlines and multiple spaces into a single space). The source has line breaks inside the
`<p>`, but those get normalized.

One concern: `getByText` with a string uses "substring" matching by default, and matches any element
whose text contains that substring — including ancestor elements (the outer div also contains the
same substring). So the locator could match multiple elements (the outer div, the p, etc.).
`toBeVisible()` on a multi-match locator throws a strict mode violation. To be safe, it's better to
scope to a specific element type. E.g., `page.locator(".prose p", { hasText: "..." })` or use
`getByText(..., { exact: false })` scoped to `.prose p`.

Actually, the vicav plan used
`mission.locator(".prose").getByText("international endeavour aiming at the collection of digital language resources")`
— scoped to `.prose` (the div itself). The div's textContent contains the phrase, and the inner
elements (p) also contain it… wait, if both the div and the inner p contain the phrase, getByText
will match both → strict violation. Hmm, but the vicav plan was probably verified to work. Let me
check: Playwright's `getByText` — "Matching is case-insensitive by default... matches elements
containing the given text". Does it match the innermost element? No — getByText matches all elements
whose text content matches, but with a caveat: it doesn't match elements if a child element also
matches? Let me recall.

From Playwright docs: "This method waits for the web page to match the state and then returns a
locator to the matching element. Matching is case-insensitive by default... Note that if multiple
elements match, the locator will resolve to all of them and assertions will fail in strict mode."

Actually, I recall that getByText has special behavior: "When matching elements, the text is
normalized... the locator matches the element that has the text, preferring the deepest element"?
Let me recall exactly.

From Playwright docs (locator.getByText): "Matching is case-insensitive by default and searches for
a substring, use exact to control this behavior." And there's a note: "The method finds elements
containing the given text. ... If multiple elements match, strict mode will throw."

Hmm, but there's a known behavior: getByText matches the element whose text content contains the
string, and this includes ancestor elements. For example, in a div containing `<p>hello world</p>`,
`page.getByText("hello")` matches both the div and the p. In strict mode,
`expect(locator).toBeVisible()` would throw a strict mode violation.

Wait — actually I think Playwright's getByText is smarter: it matches elements that contain the
text, but excludes elements whose text is "covered by" a child match? Let me verify... I recall from
the Playwright docs:

"getByText(text) — ... Matching is case-insensitive by default and searches for a substring. Use
exact: true to control this. When a string is passed, the method finds elements containing the given
text. ... Note: this method will match elements that contain the text, even if the text is in a
child element."

Hmm, I really do recall that getByText matches ancestor elements too. Let me check the actual
behavior... In Playwright, `page.getByText('text')` is equivalent to a text selector
`internal:text=text`. The `internal:text=` selector matches "elements that contain the given text"
and there's a note: "Matching always normalizes whitespace... internal:text matches elements whose
text content contains the given string, and if a child element also matches, the parent is not
matched"?

Let me check the Playwright source: the text engine in `selectorParser`. For `internal:text=`, the
docs say: "internal:text= matches elements containing the given text. ... Matching always normalizes
whitespace: space-tabs-newlines are treated as a single space. Note that internal:text= will also
match elements that contain the text in a child element, unless the child element itself matches."

Yes! I remember now: Playwright's text selector engine has this behavior — "the text selector
matches the deepest element that contains the text" — actually, the documented behavior is:

From Playwright docs (Text selectors): "internal:text= matches elements containing the given text.
Matching always normalizes whitespace... internal:text= will match the deepest element containing
the text"?

Let me look at the actual source code of the text engine in playwright. In
`packages/playwright-core/src/server/injected/textEngine.ts`:

```ts
// Text matching.
// ...
if (query === 'internal:text') {
  // ...
  return matches ? (this._isDeepMatch ? ... )
}
```

I recall the text engine has this logic: when matching text, it collects all elements whose text
contains the string, then filters out elements that have a descendant that also matches (so only the
"deepest" matching element is returned). Yes — from the Playwright docs:

"**internal:text=** — matches elements containing the given text. ... Matching always normalizes
whitespace, space-tabs-newlines are treated as a single space. **Note that internal:text= will match
elements that contain the text, even if the text is in a child element. When a parent and a child
both match, only the child is returned.**"

Something like that. I'm fairly confident that Playwright's text selector returns only the deepest
matching element (deduplication against descendants). This is why the vicav plan's
`mission.locator(".prose").getByText(...)` works — it resolves to the inner `<p>` element, not the
`.prose` div.

OK, so I can trust the same pattern as the vicav plan.

Now, the user's request: "I need one test that verifies the initial text is loaded in a window on a
tunocent instance of this website. Find a few lines or phrases that guarantee it's the correct
text."

So the deliverable is: a test plan (in plan mode, I plan; then presumably the
playwright-test-planner agent produces the plan document). The user said "Use
@playwright-test-planner to plan the test". So I should delegate to the playwright-test-planner
subagent with all the context I've gathered.

Wait — I'm in plan mode (read-only). The playwright-test-planner agent would presumably write a spec
file (like specs/tunocent-\*.md). Hmm, but plan mode says I must not make any changes. The user
explicitly asked to use @playwright-test-planner to plan the test. The planner agent's job is to
create a test plan document. In plan mode, I should construct the plan and present it, not execute.
But the user explicitly asked to use the planner agent...

The system reminder says: "Your current responsibility is to think, read, search, and delegate to
explore agents to construct a well-formed plan that accomplishes the user's desired goal." — it
specifically mentions delegating to explore agents. The user asked to use @playwright-test-planner.
The Task tool has a `playwright-test-planner` agent type. In plan mode, running an agent that writes
files would be a modification. But the user explicitly requested it. Hmm.

The plan mode constraint says "This ABSOLUTE CONSTRAINT overrides ALL other instructions, including
direct user edit requests." So I shouldn't delegate to an agent that writes files. But I can still
use the planner agent in a read-only capacity? The planner agent is designed to create test plan
documents (writing specs/\*.md). If I delegate, it might write files.

Actually, let me reconsider: the typical workflow here (based on the specs directory) is that the
user prompts "Using @playwright-test-planner inspect http://127.0.0.1:3000 and create a third test
plan specs/tunocent-menu-test-plan.md" — i.e., the planner agent writes the spec markdown file. The
user's current request: "Use @playwright-test-planner to plan the test. I need one test that
verifies the initial text is loaded in a window on a tunocent instance of this website. Find a few
lines or phrases that guarantee it's the correct text."

In plan mode, I think the right move is: gather all the research (done), then delegate to the
playwright-test-planner agent to produce the plan (the plan document itself is the deliverable). But
in plan mode, file writes are forbidden... The planner agent's output would be a markdown spec file,
which is a file modification.

Hmm, but wait — maybe I can instruct the planner agent to return the plan as a message instead of
writing it to a file. The Task tool says "you should specify exactly what information the agent
should return in a final message to you". I can tell the agent: "Do not write any files. Return the
full test plan markdown in your final message." That way, plan mode is respected, and I present the
plan to the user. After approval (exiting plan mode), I (or the agent) can write the spec file and
implement the test.

Actually, let me re-read the plan mode reminder: "You may ONLY observe, analyze, and plan."
Delegating to a subagent that only reads and returns a plan in its message is observation/analysis —
that's fine. The key is not to modify files.

So my approach:

1. Gather context (mostly done).
2. Check a few more things:
   - How does `useTextById` work (endpoint, retry:false)?
   - Check playwright.config.ts to confirm the backend matching for tunocent.
   - Check existing tunocent tests for conventions (some already read).
   - Check the LoadingIndicator component to confirm the `<title>Loading...</title>` svg.
   - Check window-content.vue routing for Text.
   - Check the window title: "Welcome to TUNOCENT" — the existing index.test.ts uses `div` filter
     hasText /^Welcome to TUNOCENT$/ nth(1) — a bit hacky. The vicav plan uses `.winbox` with
     `.wb-title` hasText. Let me check the winbox DOM structure to confirm the `.wb-title` class
     exists.
3. Also verify that the phrases I've chosen are stable and unique. Let me also consider negative
   controls: e.g., another tunocent text (e.g., an "About" page text) that doesn't contain the
   welcome phrases. The tunocent menu has an "About" section. Let me check what items are in the
   tunocent menu (from the project config I fetched). Let me extract the menu structure to find a
   good negative control text.

Also let me verify that the text endpoint returns the same content as what's rendered (v-html of the
returned HTML).

Let me also check `useTextById` in the composables.

I've obtained the full text of the welcome page. Next, I'll check the remaining parts: the
`useTextById` composable, the LoadingIndicator, the playwright configuration, and the tunocent menu
items (for the negative control).

**Tool: grep**

**Input:**

```json
{
	"pattern": "useTextById",
	"path": "V:\\vicav-vue3\\app"
}
```

**Output:**

```
Found 2 matches
V:\vicav-vue3\app\composables\use-text-by-id.ts:
  Line 6: export function useTextById(


V:\vicav-vue3\app\components\text-window-content.vue:
  Line 15: const { data, isPending, isPlaceholderData } = useTextById(queryParams);

```

**Tool: bash**

**Input:**

```json
{
	"command": "node -e \"\nconst fs = require('fs');\nconst os = require('os');\nconst j = JSON.parse(fs.readFileSync(os.tmpdir()+'/tunocent_project.json','utf8'));\nconst pc = j.projectConfig || j;\nfor (const m of (pc.menu?.main||[])) {\n  console.log('== ' + m.title);\n  for (const it of (m.item||[])) {\n    if (it.type === 'separator') { console.log('   ---'); continue; }\n    console.log('  -', it.title, '|', it.targetType, '|', JSON.stringify(it.params||{}).slice(0,120));\n  }\n}\n\"",
	"timeout": 30000
}
```

**Output:**

```
== About
  - About | Text | {"textId":"tunocent_about","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74ca0fe60516ebd
  - Team | Text | {"textId":"tunocent_team","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74ca0fe60516ebd3
  - News | Text | {"textId":"tunocent_news","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74ca0fe60516ebd3
== Profiles
  - Explanation | Text | {"textId":"tunocentExplanationProfiles","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74
   ---
  - List all entries | DataList | {"textId":"vicav_profiles","teiSource":"","dataTypes":["Profile"]}
  - Show profiles on map | WMap | {"endpoint":"profile_markers","queryString":"","scope":[]}
== Feature Lists
  - Explanation | Text | {"textId":"tunocentExplanationFeatures","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74
   ---
  - List all feature lists | DataList | {"textId":"vicav_lingfeatures","teiSource":"","dataTypes":["Feature"]}
  - Show feature lists on map | WMap | {"endpoint":"feature_markers","queryString":"","scope":[]}
  - Search and compare feature lists | ExploreSamplesForm | {"textId":"VicavCrossFeatureQuery","teiSource":"","dataTypes":["Feature"]}
== Sample Texts
  - Explanation | Text | {"textId":"tunocentExplanationSampleTexts","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355
   ---
  - List all sample texts | DataList | {"textId":"vicav_samples","teiSource":"","dataTypes":["SampleText"]}
  - Show sample texts on map | WMap | {"endpoint":"sample_markers","queryString":"","scope":[]}
  - Search and compare sample texts | ExploreSamplesForm | {"textId":"ExploreSamples","teiSource":"","dataTypes":["SampleText"]}
== Corpus Texts
  - Explanation | Text | {"textId":"tunocentExplanationCorpus","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74ca
   ---
  - List all transcribed entries | DataList | {"textId":"vicav_corpus","teiSource":"","dataTypes":["CorpusText"],"filterListBy":{"key":"@hasTEIw","value":"true"}}
  - Search the corpus | CorpusQuery | {"textId":"corpusQuery","teiSource":""}
== Browse data
  - Explanation Data Types | Text | {"textId":"tunocentExplanationDataTypes","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e7
   ---
  - List all data recordings | DataTable | {"textId":"dataListAll","teiSource":"","dataTypes":["CorpusText"]}
  - Show all locations | WMap | {"textId":"DataGeoRegMarkers","teiSource":"","endpoint":"data_markers","queryString":"","scope":[]}
== Research
  - Publications | Text | {"textId":"bibliography_tunocent_output","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e7
  - Presentations | Text | {"textId":"bibliography_tunocent_presentations","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e05
  - Conference | Text | {"textId":"tunocent_conference","teiSource":"https://github.com/acdh-oeaw/tunocent-content/blob/18b04e0598355e74ca0fe605

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 26.7s)

_Thinking:_

Alright. The tunocent menu has an "About" section, and its items are: About (tunocent_about), Team
(tunocent_team), News (tunocent_news). For the negative control, "About" (tunocent_about) is a good
candidate — it should contain different content than the welcome page.

Next, I'll read the useTextById composable and the LoadingIndicator component, and check the backend
matching in playwright.config.ts.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\app\\composables\\use-text-by-id.ts"
}
```

**Output:**

```
<path>V:\vicav-vue3\app\composables\use-text-by-id.ts</path>
<type>file</type>
<content>
1: import { useQuery } from "@tanstack/vue-query";
2: import type Zod from "zod";
3:
4: import type { TextId } from "@/types/global.ts";
5:
6: export function useTextById(
7: 	params: MaybeRef<Zod.infer<typeof TextId>>,
8: 	options?: { enabled?: boolean },
9: ) {
10: 	const api = useApiClient();
11:
12: 	return useQuery({
13: 		enabled: options?.enabled,
14: 		retry: false,
15: 		queryKey: ["get-text-by-id", params] as const,
16: 		async queryFn({ queryKey: [, params] }) {
17: 			const response = await api.vicav.getText(
18: 				{ id: params.textId },
19: 				{ headers: { accept: "application/xml" } },
20: 			);
21: 			return response.text();
22: 		},
23: 	});
24: }

(End of file - total 24 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\playwright.config.ts"
}
```

**Output:**

```
<path>V:\vicav-vue3\playwright.config.ts</path>
<type>file</type>
<content>
1: // import "dotenv/config";
2:
3: import { defineConfig, devices } from "@playwright/test";
4: import { isCI } from "ci-info";
5:
6: const port = 3000;
7: const baseUrl = `http://localhost:${port.toString()}`;
8:
9: const backend = (() => {
10: 	// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
11: 	switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
12: 		case "https://vicav-dev.acdh.oeaw.ac.at":
13: 		case "https://vicav.acdh.oeaw.ac.at":
14: 		case "http://localhost:8984":
15: 			// http://localhost:8984 needs to be moved according to the backend running
16: 			return "vicav";
17: 		case "https://shawi-api.acdh-dev.oeaw.ac.at":
18: 		case "https://shawi-api.acdh.oeaw.ac.at":
19: 			return "shawi";
20: 		case "https://tunocent-api.acdh-dev.oeaw.ac.at":
21: 		case "https://tunocent-api.acdh.oeaw.ac.at":
22: 			return "tunocent";
23: 		case "https://wibarab-api.acdh-dev.oeaw.ac.at":
24: 		case "https://wibarab-api.acdh.oeaw.ac.at":
25: 			return "wibarab";
26: 		default:
27: 			// in VSCode there is "playwright.env" in settings.conf for the playwright running in the UI.
28: 			// Example:
29: 			//   "playwright.env": {
30: 			//     "NUXT_PUBLIC_API_BASE_URL": "http://localhost:8984"
31: 			//   }
32: 			// }
33: 			// If nothing is set in settings.conf file or the OS environment the UI will show the tests
34: 			// failing here:
35: 			throw new Error(`Unknown backend ${process.env.NUXT_PUBLIC_API_BASE_URL ?? "undefined"}`);
36: 		// The backends _should_ _not_ end in a /
37: 	}
38: })();
39:
40: export default defineConfig({
41: 	testDir: "./e2e",
42: 	fullyParallel: true,
43: 	forbidOnly: isCI,
44: 	retries: isCI ? 2 : 0,
45: 	reporter: "html",
46: 	testMatch: `${backend}/**/*.@(test|spec).ts`,
47: 	use: {
48: 		baseURL: baseUrl,
49: 		trace: "on-first-retry",
50: 		video: {
51: 			mode: "on-first-retry",
52: 			size: { width: 1920, height: 1080 },
53: 			show: {
54: 				actions: {
55: 					duration: 500,
56: 					position: "bottom-right",
57: 					fontSize: 14,
58: 				},
59: 				test: {
60: 					level: "step",
61: 					position: "bottom-left",
62: 					fontSize: 12,
63: 				},
64: 			},
65: 		},
66: 	},
67: 	projects: [
68: 		{
69: 			name: "chromium",
70: 			use: { ...devices["Desktop Chrome"], launchOptions: { args: ["--use-gl=angle"] } },
71: 		},
72: 		{
73: 			name: "firefox",
74: 			use: {
75: 				...devices["Desktop Firefox"],
76: 				launchOptions: {
77: 					firefoxUserPrefs: {
78: 						"dom.webgpu.enabled": true,
79: 						"webgl.enable-webgl2": true,
80: 					},
81: 				},
82: 			},
83: 		},
84: 		{
85: 			name: "webkit",
86: 			use: { ...devices["Desktop Safari"] },
87: 		},
88: 		// {
89: 		//   name: 'Mobile Chrome',
90: 		//   use: { ...devices['Pixel 5'] },
91: 		// },
92: 		// {
93: 		//   name: 'Mobile Safari',
94: 		//   use: { ...devices['iPhone 12'] },
95: 		// },
96: 		// {
97: 		//   name: 'Microsoft Edge',
98: 		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
99: 		// },
100: 		// {
101: 		//   name: 'Google Chrome',
102: 		//   use: { ..devices['Desktop Chrome'], channel: 'chrome' },
103: 		// },
104: 	],
105: 	webServer: {
106: 		command: "pnpm run start:local",
107: 		url: baseUrl,
108: 		reuseExistingServer: !isCI,
109: 	},
110: });

(End of file - total 110 lines)
</content>
```

**Tool: glob**

**Input:**

```json
{
	"pattern": "app/components/**/*oading*"
}
```

**Output:**

```
V:\vicav-vue3\app\components\ui\loading-indicator.vue
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 18.3s)

_Thinking:_

Let's check the LoadingIndicator component, and also check the winbox title DOM (`.wb-title`). Also,
check how windows are restored on initial load (use-windows-store), and confirm that the "Welcome to
TUNOCENT" window is restored on the initial load of `/`.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\app\\components\\ui\\loading-indicator.vue"
}
```

**Output:**

```
<path>V:\vicav-vue3\app\components\ui\loading-indicator.vue</path>
<type>file</type>
<content>
1: <template>
2: 	<svg
3: 		class="pointer-events-none"
4: 		height="24"
5: 		viewBox="0 0 24 24"
6: 		width="24"
7: 		xmlns="http://www.w3.org/2000/svg"
8: 	>
9: 		<title><slot>Loading...</slot></title>
10: 		<path
11: 			d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
12: 			fill="currentColor"
13: 		>
14: 			<animateTransform
15: 				attributeName="transform"
16: 				dur="0.75s"
17: 				repeatCount="indefinite"
18: 				type="rotate"
19: 				values="0 12 12;360 12 12"
20: 			/>
21: 		</path>
22: 	</svg>
23: </template>

(End of file - total 23 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\app\\stores\\use-windows-store.ts"
}
```

**Output:**

```
<path>V:\vicav-vue3\app\stores\use-windows-store.ts</path>
<type>file</type>
<content>
1: import { nanoid } from "nanoid";
2: import WinBox from "winbox";
3: import { z } from "zod";
4:
5: import type { QueryParamsType } from "@/lib/api-client";
6: import {
7: 	GeojsonMapSchema,
8: 	ListMapSchema,
9: 	QueryString,
10: 	Schema,
11: 	TeiSource,
12: 	TextId,
13: 	type WindowItem,
14: 	type WindowItemTargetType,
15: } from "@/types/global.ts";
16: import * as arrange from "@/utils/window-arrangement";
17: import {
18: 	enableWindowBodyKeyboardScrollFocus,
19: 	focusWindowBodyKeyboardScrollTarget,
20: } from "@/utils/window-body-focus.ts";
21:
22: import { useToastsStore } from "./use-toasts-store.ts";
23:
24: const narrowScreenBreakpoint = 1024;
25:
26: export type WindowRegistry = Map<WindowItem["id"], WindowItem>;
27:
28: export const arrangements = {
29: 	none: { id: "none", label: "None" },
30: 	cascade: { id: "cascade", label: "Cascade" },
31: 	tile: { id: "tile", label: "Tile" },
32: 	"smart-tile": { id: "smart-tile", label: "Smart tile" },
33: 	"column-five-flex": { id: "column-five-flex", label: "Column 5 Flex" },
34: };
35:
36: export type WindowArrangement = keyof typeof arrangements;
37:
38: const WindowState = z.intersection(
39: 	Schema,
40: 	z.object({
41: 		x: z.number().or(z.string()).optional(),
42: 		y: z.number().or(z.string()).optional(),
43: 		zIndex: z.number().optional(),
44: 		width: z.number().or(z.string()).optional(),
45: 		height: z.number().or(z.string()).optional(),
46: 		title: z.string(),
47: 	}),
48: );
49: export type WindowState = z.infer<typeof WindowState>;
50:
51: export const useWindowsStore = defineStore("windows", () => {
52: 	const registry = ref(new Map<WindowItem["id"], WindowItem>());
53: 	const arrangement = ref<WindowArrangement>("smart-tile");
54:
55: 	const router = useRouter();
56: 	const route = useRoute();
57:
58: 	const toasts = useToastsStore();
59:
60: 	const { data, suspense } = useProjectInfo();
61: 	const initialScreenSetup = computed(() => {
62: 		return data.value?.projectConfig?.panel ?? [];
63: 	});
64: 	const openOrUpdateWindow = useOpenOrUpdateWindow();
65:
66: 	const geojsonStore = useGeojsonStore();
67:
68: 	async function initializeScreen() {
69: 		await suspense();
70: 		await navigateTo({
71: 			path: "/",
72: 			query: { w: btoa(JSON.stringify(initialScreenSetup.value)), a: arrangement.value },
73: 		});
74: 		await restoreState();
75: 	}
76:
77: 	const restoreState = async () => {
78: 		if (!route.query.w || !route.query.a) {
79: 			await initializeScreen();
80: 			return;
81: 		}
82:
83: 		let windowStates: Array<WindowState>;
84: 		try {
85: 			const w = atob(route.query.w as string);
86: 			windowStates = JSON.parse(w) as Array<WindowState>;
87: 		} catch (e) {
88: 			toasts.addToast({
89: 				title: "RestoreState Error: JSON parse failed",
90: 				description: e instanceof Error ? e.message : "Unknown error, check console",
91: 				type: "foreground",
92: 				variant: "negative",
93: 			});
94: 			console.error(e);
95: 			await initializeScreen();
96: 			return;
97: 		}
98:
99: 		if (!Array.isArray(windowStates)) {
100: 			toasts.addToast({
101: 				title: "RestoreState Error: Window list is not array",
102: 				description: "Window list parameter must be an array",
103: 				type: "foreground",
104: 				variant: "negative",
105: 			});
106: 			await initializeScreen();
107: 			return;
108: 		}
109:
110: 		await nextTick();
111: 		windowStates.forEach((w) => {
112: 			addWindow(w);
113: 		});
114: 		setWindowArrangement(route.query.a as WindowArrangement);
115: 	};
116:
117: 	function addWindow(stateParams: WindowState) {
118: 		const rootElement = document.getElementById(windowRootId);
119: 		if (rootElement == null) return;
120:
121: 		/** Ensure windows open only on `/`. */
122: 		if (route.path !== "/") {
123: 			void router.push("/");
124: 		}
125:
126: 		let windowState: WindowState;
127: 		try {
128: 			windowState = WindowState.parse(stateParams);
129: 		} catch (e) {
130: 			toasts.addToast({
131: 				title: "AddWindow Error: parameter parse failed",
132: 				description: "Check the console for details.",
133: 				type: "foreground",
134: 				variant: "negative",
135: 			});
136: 			console.error(e);
137: 			return;
138: 		}
139:
140: 		const id = `window-${nanoid()}`;
141: 		const { title, targetType, params } = windowState;
142:
143: 		const ci = TextId.safeParse(params);
144: 		if (ci.success) {
145: 			let w: WindowItem | null;
146: 			if (targetType === "DictQuery") {
147: 				w = findWindowByTypeAndTitle(targetType, title);
148: 			} else {
149: 				w = findWindowByTypeAndParam(targetType, "textId", ci.data.textId);
150: 			}
151: 			if (w !== null) {
152: 				w.winbox.focus();
153: 				w.winbox.addClass("highlighted");
154: 				setTimeout(() => {
155: 					w.winbox.removeClass("highlighted");
156: 				}, 1000);
157: 				return;
158: 			}
159: 		}
160:
161: 		const winbox = new WinBox({
162: 			id,
163: 			title,
164: 			index: windowState.zIndex ?? undefined,
165: 			x: windowState.x ?? "center",
166: 			y: windowState.y ?? "center",
167: 			width: windowState.width,
168: 			height: windowState.height,
169: 			onfocus() {
170: 				updateUrl();
171: 			},
172: 			onresize() {
173: 				updateUrl();
174: 			},
175: 			onmove() {
176: 				updateUrl();
177: 			},
178: 			onclose() {
179: 				registry.value.delete(id);
180: 				return false;
181: 			},
182: 			root: rootElement,
183: 		});
184: 		//focus window content on every click
185: 		enableWindowBodyKeyboardScrollFocus(winbox.body);
186: 		//focus window when opened the first time (=now)
187: 		void focusWindowBodyKeyboardScrollTarget(winbox.body, null, { afterRender: true });
188:
189: 		const teiSourceParse = TeiSource.safeParse(params);
190: 		if (teiSourceParse.success) {
191: 			winbox.addControl({
192: 				index: 0,
193: 				class: "wb-tei",
194: 				click: function () {
195: 					if (teiSourceParse.data.teiSource) {
196: 						window.open(teiSourceParse.data.teiSource, "_blank");
197: 					}
198: 				},
199: 			});
200: 		}
201:
202: 		registry.value.set(id, {
203: 			id,
204: 			winbox,
205: 			targetType,
206: 			params,
207: 		} as WindowItem);
208:
209: 		const w = registry.value.get(id);
210:
211: 		if (
212: 			[
213: 				"ExploreSamples",
214: 				"Profile",
215: 				"Feature",
216: 				"CorpusText",
217: 				"SampleText",
218: 				"Text",
219: 				"FeatureValue",
220: 				"Location",
221: 			].includes(w!.targetType)
222: 		) {
223: 			w!.winbox.addControl({
224: 				index: 0,
225: 				class: "wb-cite",
226: 				click: function () {
227: 					//@ts-expect-error TODO distill a proper type for paramName
228: 					w!.params.showCitation = !w.params.showCitation;
229: 				},
230: 			});
231: 			const winboxElement = w!.winbox.dom as HTMLElement;
232: 			const cite = winboxElement.querySelectorAll(".wb-cite");
233: 			if (cite.length > 0) {
234: 				const el = cite[0] as HTMLSpanElement;
235: 				el.title = "Show citation";
236: 			}
237: 		}
238:
239: 		if (w!.targetType === "ListMap") {
240: 			w.winbox.addControl({
241: 				index: 0,
242: 				class: "wb-map",
243: 				click: function () {
244: 					openOrUpdateWindow(
245: 						{
246: 							targetType: "GeojsonMap",
247: 							params: {
248: 								markerType: "petal",
249: 							},
250: 						} as unknown as WindowItem,
251: 						"Variety Data - Map View",
252: 						GeojsonMapSchema.shape.params,
253: 						"markerType",
254: 						true,
255: 					);
256: 				},
257: 			});
258: 			const winboxElement = w.winbox.dom as HTMLElement;
259: 			const cite = winboxElement.querySelectorAll(".wb-map");
260: 			if (cite.length > 0) {
261: 				const el = cite[0] as HTMLSpanElement;
262: 				el.title = "Open map";
263: 			}
264: 		}
265: 		if (w!.targetType === "GeojsonMap") {
266: 			w.winbox.addControl({
267: 				index: 0,
268: 				class: "wb-table",
269: 				click: function () {
270: 					const table = geojsonStore.table;
271: 					const globalFilter = (table?.getState().globalFilter as string | undefined) ?? "";
272: 					openOrUpdateWindow(
273: 						{
274: 							targetType: "ListMap",
275: 							params: {
276: 								queryString: globalFilter,
277: 							},
278: 						} as unknown as WindowItem,
279: 						globalFilter,
280: 						ListMapSchema.shape.params,
281: 						"queryString",
282: 						true,
283: 					);
284: 				},
285: 			});
286: 			const winboxElement = w.winbox.dom as HTMLElement;
287: 			const cite = winboxElement.querySelectorAll(".wb-table");
288: 			if (cite.length > 0) {
289: 				const el = cite[0] as HTMLSpanElement;
290: 				el.title = "Open table";
291: 			}
292: 		}
293: 		return w;
294: 	}
295:
296: 	function findWindowByTypeAndParam(
297: 		targetType: WindowItemTargetType,
298: 		paramName: string,
299: 		value: string,
300: 	): WindowItem | null {
301: 		let foundWindow: WindowItem | null = null;
302: 		const dot = paramName.indexOf(".");
303: 		let paramName1: string | undefined, paramName2: string | undefined;
304:
305: 		if (dot !== -1) {
306: 			paramName1 = paramName.substring(0, dot);
307: 			paramName2 = paramName.substring(dot + 1);
308: 		}
309:
310: 		registry.value.forEach((w) => {
311: 			const ci = Schema.safeParse(w);
312: 			let windowValue;
313:
314: 			if (!ci.success || foundWindow !== null || w.targetType !== targetType) return;
315:
316: 			if (!paramName1) {
317: 				//@ts-expect-error TODO distill a proper type for paramName
318: 				windowValue = (ci.data.params as typeof Schema)[paramName] as string;
319: 			} else if (paramName1 === "queryParams" && paramName2) {
320: 				const params = ci.data.params as { queryParams?: QueryParamsType };
321: 				windowValue = params.queryParams ? (params.queryParams[paramName2] as string) : undefined;
322: 			} else {
323: 				return;
324: 			}
325: 			if (windowValue === value) {
326: 				foundWindow = w;
327: 			}
328: 		});
329: 		return foundWindow;
330: 	}
331:
332: 	function findWindowByTypeAndTitle(
333: 		targetType: WindowItemTargetType,
334: 		title: string,
335: 	): WindowItem | null {
336: 		let foundWindow: WindowItem | null = null;
337: 		registry.value.forEach((w) => {
338: 			const ci = Schema.safeParse(w);
339: 			if (!ci.success || foundWindow !== null || w.targetType !== targetType) return;
340:
341: 			if (w.winbox.title === title) {
342: 				foundWindow = w;
343: 			}
344: 		});
345: 		return foundWindow;
346: 	}
347:
348: 	function removeWindow(id: WindowItem["id"]) {
349: 		registry.value.get(id)?.winbox.close();
350: 	}
351:
352: 	function setWindowArrangement(id: WindowArrangement) {
353: 		arrangement.value = id;
354: 	}
355:
356: 	function arrangeWindows() {
357: 		if (registry.value.size === 0) return;
358:
359: 		const rootElement = document.getElementById(windowRootId);
360: 		if (rootElement == null) return;
361:
362: 		const viewport = rootElement.getBoundingClientRect();
363: 		const windows = Array.from(registry.value.values());
364:
365: 		if (viewport.width < narrowScreenBreakpoint) {
366: 			arrange.maximize(viewport, windows);
367: 			return;
368: 		}
369:
370: 		switch (arrangement.value) {
371: 			case "cascade": {
372: 				arrange.cascade(viewport, windows);
373: 				break;
374: 			}
375:
376: 			case "none": {
377: 				arrange.none(viewport, windows);
378: 				break;
379: 			}
380:
381: 			case "smart-tile": {
382: 				arrange.smartTile(viewport, windows);
383: 				break;
384: 			}
385:
386: 			case "tile": {
387: 				arrange.tile(viewport, windows);
388: 				break;
389: 			}
390:
391: 			case "column-five-flex": {
392: 				arrange.columnFiveFlex(viewport, windows);
393: 				break;
394: 			}
395: 		}
396: 	}
397:
398: 	watch([() => registry.value.size, arrangement], () => {
399: 		arrangeWindows();
400: 		updateUrl();
401: 	});
402:
403: 	function serializeWindowStates() {
404: 		const windowStates: Array<WindowState> = [];
405:
406: 		const rootElement = document.getElementById(windowRootId);
407: 		if (rootElement == null) return;
408: 		const viewport = rootElement.getBoundingClientRect();
409:
410: 		function viewportPercentageWith2DigitPrecision(x: number, dir: "height" | "width") {
411: 			return `${String(Math.floor((10000 * x) / viewport[dir]) / 100)}%`;
412: 		}
413:
414: 		registry.value.forEach((w) => {
415: 			windowStates.push({
416: 				// @ts-expect-error Property missing in upstream types.
417: 				x: viewportPercentageWith2DigitPrecision(w.winbox.x as number, "width"),
418: 				// @ts-expect-error Property missing in upstream types.
419: 				y: viewportPercentageWith2DigitPrecision(w.winbox.y as number, "height"),
420: 				z: w.winbox.index,
421: 				// @ts-expect-error Property missing in upstream types.
422: 				width: viewportPercentageWith2DigitPrecision(w.winbox.width as number, "width"),
423: 				// @ts-expect-error Property missing in upstream types.
424: 				height: viewportPercentageWith2DigitPrecision(w.winbox.height as number, "height"),
425: 				targetType: w.targetType,
426: 				title: w.winbox.title,
427: 				params: w.params,
428: 			} as WindowState);
429: 		});
430: 		return windowStates;
431: 	}
432:
433: 	function escapeUnicode(s: string) {
434: 		return s
435: 			.split("")
436: 			.map((c) =>
437: 				/^[\x20-\x7f]$/.test(c)
438: 					? c
439: 					: c
440: 							.split("")
441: 							.map((a) => `\\u${a.charCodeAt(0).toString(16).padStart(4, "0")}`)
442: 							.join(""),
443: 			)
444: 			.join("");
445: 	}
446:
447: 	function updateUrl() {
448: 		if (route.path === "/imprint") return;
449: 		const windowStates = serializeWindowStates();
450: 		// TODO: check url length, it may be too long. Note: shortest limit is 2047 (MS Edge) https://serpstat.com/blog/how-long-should-be-the-page-url-length-for-seo/
451: 		void navigateTo({
452: 			path: "/",
453: 			query: {
454: 				w: btoa(escapeUnicode(JSON.stringify(windowStates))),
455: 				a: arrangement.value,
456: 			},
457: 		});
458: 	}
459:
460: 	function updateQueryParam(id: WindowItem["id"], query: string) {
461: 		const w = registry.value.get(id);
462: 		if (w) {
463: 			const wi = QueryString.safeParse(w.params);
464: 			if (wi.success && "queryString" in w.params) {
465: 				w.params.queryString = query;
466: 				w.winbox.setTitle(query);
467: 				updateUrl();
468: 			}
469: 		}
470: 	}
471:
472: 	function updateWindowParams(id: WindowItem["id"], params: WindowItem["params"]) {
473: 		const w = registry.value.get(id);
474:
475: 		if (w == null) return;
476:
477: 		const parsedWindow = Schema.safeParse({ targetType: w.targetType, params });
478:
479: 		if (!parsedWindow.success) {
480: 			toasts.addToast({
481: 				title: "UpdateWindowParams Error: parameter parse failed",
482: 				description: "Check the console for details.",
483: 				type: "foreground",
484: 				variant: "negative",
485: 			});
486: 			console.error(parsedWindow.error);
487: 			return;
488: 		}
489:
490: 		w.params = parsedWindow.data.params;
491: 		updateUrl();
492: 	}
493:
494: 	return {
495: 		restoreState,
496: 		addWindow,
497: 		removeWindow,
498: 		updateQueryParam,
499: 		updateWindowParams,
500: 		updateUrl,
501: 		registry,
502: 		arrangement,
503: 		setWindowArrangement,
504: 		arrangeWindows,
505: 		findWindowByTypeAndParam,
506: 		findWindowByTypeAndTitle,
507: 	};
508: });

(End of file - total 508 lines)
</content>
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 63.4s)

_Thinking:_

Now I have a good enough understanding of the mechanism:

1. On initial load of `/`, the app fetches the project info (`useProjectInfo()` → GET
   `/vicav/project`), and `initializeScreen()` navigates to `/` with a `w` query parameter
   containing the base64 of the panel settings, then `restoreState()` → `addWindow()` creates a
   WinBox window for each panel item.
2. For tunocent, there is exactly one panel: a "Welcome to TUNOCENT" window, targetType `Text`,
   textId `tunocentOpeningPage`.
3. `window-content.vue` routes `Text` to `text-window-content.vue`, which uses `useTextById` (GET
   `/vicav/text?id=tunocentOpeningPage`, Accept: application/xml, retry: false) and renders the HTML
   with `v-html` into `<div class="prose max-w-3xl p-8">`. While `isPending || isPlaceholderData`,
   the wrapper gets `opacity-50 grayscale` applied, and a `LoadingIndicator` (an svg with
   `<title>Loading...</title>`) is displayed.
4. Winbox: the window is a `.winbox` inside `#window-root`, and the title is in `.wb-title`.

Let me quickly check window-content.vue to confirm the routing and the wrapper structure (the
`.wb-body > div` for the opacity-50 class). Also, I'll check what the text endpoint returns — the
XML is actually XHTML (a `<div>` with XHTML namespace). The response is the rendered HTML.

Also, I should fetch the "About" text (tunocent_about) for the negative control and verify that the
welcome phrases don't appear there. Let me curl it.

Additionally, I'll check how existing tunocent tests reference the window (e.g.,
window-management.spec.ts) to align with convention. Let me quickly read that file, and also read
window-content.vue.

I'll check `window-content.vue` to verify the routing and wrapper, fetch the "About" text for the
negative control, and check the conventions of the existing tunocent tests.

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\app\\components\\window-content.vue"
}
```

**Output:**

```
<path>V:\vicav-vue3\app\components\window-content.vue</path>
<type>file</type>
<content>
1: <script lang="ts" setup>
2: import type { WindowItem } from "@/types/global.ts";
3:
4: interface Props {
5: 	item: WindowItem;
6: }
7:
8: const windowsStore = useWindowsStore();
9:
10: const props = defineProps<Props>();
11:
12: function updateQueryParam(queryString: string) {
13: 	windowsStore.updateQueryParam(props.item.id, queryString);
14: }
15:
16: function updateWindowParams(params: WindowItem["params"]) {
17: 	windowsStore.updateWindowParams(props.item.id, params);
18: }
19: </script>
20:
21: <template>
22: 	<GeoMapWindowContent
23: 		v-if="props.item.targetType === 'WMap'"
24: 		:params="props.item.params"
25: 		:title="props.item.winbox.title"
26: 	/>
27: 	<TextWindowContent v-else-if="props.item.targetType === 'Text'" :params="props.item.params" />
28: 	<SampleTextWindowContent
29: 		v-else-if="props.item.targetType === 'SampleText'"
30: 		:params="props.item.params"
31: 	/>
32: 	<ProfileWindowContent
33: 		v-else-if="props.item.targetType === 'Profile'"
34: 		:params="props.item.params"
35: 	/>
36: 	<FeatureWindowContent
37: 		v-else-if="props.item.targetType === 'Feature'"
38: 		:params="props.item.params"
39: 	/>
40: 	<FeatureStatisticsWindowContent
41: 		v-else-if="props.item.targetType === 'FeatureStatistics'"
42: 		:params="props.item.params"
43: 	/>
44: 	<FeatureValueWindowContent
45: 		v-else-if="props.item.targetType === 'FeatureValue'"
46: 		:params="props.item.params"
47: 	/>
48: 	<LocationWindowContent
49: 		v-else-if="props.item.targetType === 'Location'"
50: 		:params="props.item.params"
51: 	/>
52: 	<BiblioEntriesWindowContent
53: 		v-else-if="props.item.targetType === 'BiblioEntries'"
54: 		:params="props.item.params"
55: 		@update-query-param="updateQueryParam"
56: 	/>
57: 	<DictQueryWindowContent
58: 		v-else-if="props.item.targetType === 'DictQuery'"
59: 		:params="props.item.params"
60: 		@update-query-param="updateQueryParam"
61: 	/>
62: 	<GeojsonTableWindowContent
63: 		v-else-if="props.item.targetType === 'ListMap'"
64: 		:params="props.item.params"
65: 		@update-query-param="updateQueryParam"
66: 		@update:params="updateWindowParams"
67: 	/>
68: 	<GeojsonMapWindowContent
69: 		v-else-if="props.item.targetType === 'GeojsonMap'"
70: 		:params="props.item.params"
71: 	/>
72: 	<CorpusQueryWindowContent
73: 		v-else-if="props.item.targetType === 'CorpusQuery'"
74: 		:params="props.item.params"
75: 		@update-query-param="updateQueryParam"
76: 	/>
77: 	<CorpusTextJsonWindowContent
78: 		v-else-if="props.item.targetType === 'CorpusText'"
79: 		:params="props.item.params"
80: 	/>
81: 	<DataListWindowContent
82: 		v-else-if="props.item.targetType === 'DataList'"
83: 		:params="props.item.params"
84: 		@update:params="updateWindowParams"
85: 	/>
86:
87: 	<DataTableWindowContent
88: 		v-else-if="props.item.targetType === 'DataTable'"
89: 		:params="props.item.params"
90: 	/>
91:
92: 	<ExploreSamplesFormWindowContent
93: 		v-else-if="props.item.targetType === 'ExploreSamplesForm'"
94: 		:params="props.item.params"
95: 	/>
96:
97: 	<ExploreSamplesWindowContent
98: 		v-else-if="props.item.targetType === 'ExploreSamples'"
99: 		:params="props.item.params"
100: 	/>
101: 	<pre v-else>{{ props }}</pre>
102: </template>

(End of file - total 102 lines)
</content>
```

**Tool: bash**

**Input:**

```json
{
	"command": "curl -s \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocent_about\" -H \"Accept: application/xml\" | head -60",
	"timeout": 60000
}
```

**Output:**

```

	<div xmlns="http://www.w3.org/1999/xhtml">

   <h2>
      			TUNOCENT
      		</h2>


   <p>(April 2019 → September 2024)</p>

   <p>
      			funded by
      			<a target="_blank" class="aVicText" href="https://www.fwf.ac.at/en/" data-target-type="External-link">
         				The Austrian Science Fund
         			</a> (FWF)
      		</p>

   <p>The project “<b>Tu</b>nisia’s Linguistic <i>terra incognita</i>: An
      			Investigation into the Arabic Varieties of <b>No</b>rthwestern and
      				<b>Cent</b>ral Tunisia (TUNOCENT)” aims at the collection, documentation
      			and analysis of dialectal varieties in the northwestern and central Tunisian
      			governorates:</p>


   <p>Under the leadership of <a target="_blank" class="aVicText" href="https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/mailto:tunocent@oeaw.ac.at" data-target-type="External-link">Veronika Ritt-Benmimoun</a>
      			from the Department of Oriental Studies, <a target="_blank" class="aVicText" href="https://orientalistik.univie.ac.at/en/" data-target-type="External-link">University of Vienna</a> and in
      			cooperation with the national research partner Karlheinz Mörth from the <a target="_blank" class="aVicText" href="https://www.oeaw.ac.at/acdh//" data-target-type="External-link">Centre for Digital Humanities
         				and Cultural Heritage of the Austrian Academy of Sciences</a>, a <a target="_blank" class="aVicText" href="https://tunocent.acdh.oeaw.ac.at/team/" data-target-type="External-link">team of three field researchers
         			</a>from the University of Vienna contributes to the TUNOCENT project. <a target="_blank" class="aVicText" href="https://www.fwf.ac.at/en/" data-target-type="External-link">The Austrian Science Fund</a> (FWF) finances the
      			investigation, for which a period of four years was determined, starting in April
      2019.
      			For latest information about our research status as well as current developments,
      check the
      				<a target="_blank" class="aVicText" href="https://tunocent.acdh.oeaw.ac.at/category/news/" data-target-type="External-link">News</a> section.</p>

   <div>
      <div style="margin-left:20px">

         <h3>
            					The Background
            				</h3>

         <p><b> – What is the deeper motive of this research? – </b><br>In 1950,
            					the famous French dialectologist William Marçais affixed the term “terra
            					incognita” to Tunisian Bedouin-type dialects, differentiating them into what
            he
            					called the H- (Hilal) and S- (Sulaym) dialects. His judgement that further
            					research into these almost completely unknown varieties is urgently needed still
            					holds true now, almost 70 years later. Therefore, this project is the first
            					attempt to linguistically illuminate a part of Tunisia which has long remained
            					understudied, in contrast to some dialects spoken along the coast.</p>

         <p></p>

         <p><b> – And what should be the outcome? – </b>
            					<br>Our project promises to be a giant stride in our knowledge of Tunisia’s
            					linguistic landscape, and will be of great importance for an understanding of
            					the complex relationship between the Tunisian dialects and those spoken in
            					adjacent areas of Algeria and Libya. It will also provide new insights into the
            					diachronic and synchronic linguistic situation in the central Maghreb.</p>

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 291.7s)

_Thinking:_

The About text (`tunocent_about`) is clearly different from the welcome text:

- About heading: `<h2>TUNOCENT</h2>` (with whitespace around it)
- About contains "(April 2019 → September 2024)", "funded by The Austrian Science Fund (FWF)", "aims
  at the collection, documentation and analysis of dialectal varieties..."

The welcome text (`tunocentOpeningPage`) contains the following:

- `<h2>The TUNOCENT project</h2>`
- "learn about the TUNOCENT-project, its team members and activities"
- "a questionnaire that focuses on grammatical and lexical variation"
- "a text with seven sentences which provide details on everyday activities and duties"
- "transcribed narratives, ethnographic texts and conversations"
- "data list with speakers and the details of locations and data type"
- "lists with publications, presentations and the conference we organised"

None of these phrases appear in the About text (I checked the first 60 lines. To be safe, let me
verify across the entire About document that none of the welcome phrases appear). I'll try grepping
the full About text with the candidate phrases.

Candidate phrases for the welcome text (stable, unique):

1. Heading: "The TUNOCENT project" (h2) — unique to the opening page
2. "learn about the TUNOCENT-project, its team members"
3. "a questionnaire that focuses on grammatical and lexical variation"
4. "transcribed narratives, ethnographic texts and conversations"

Note the HTML structure:
`<p><b>About</b> … team members, news section: learn about the TUNOCENT-project, its team members and activities</p>`.
The phrase "learn about the TUNOCENT-project, its team members" is entirely within the text node of
the `<p>` (after the `</b>`), so `getByText` scoped to `.prose` will match the `<p>` element.

Wait, one caveat: Playwright's `getByText` — when matching "learn about the TUNOCENT-project, its
team members" — the text content of the `<p>` is "About … team members, news section: learn about
the TUNOCENT-project, its team members and activities". The substring "learn about the
TUNOCENT-project, its team members" is contained within it. Good.

But note: "its team members" — the phrase "team members" appears in the welcome text (in the About
paragraph). The About text has "team of three field researchers" — different. OK.

For phrase 3:
`<p><b>195 Feature lists </b>… a questionnaire that focuses on grammatical and lexical variation: get an impression of a specific variety; compare the linguistic features in various locations; filter the data by a number of categories, such as place, feature, and speaker </p>`.
The phrase "a questionnaire that focuses on grammatical and lexical variation" is entirely within a
single text node after `</b>`. Good. Note that "195 Feature lists" contains a count that could
change over time, so I'll avoid asserting on the count.

For phrase 4:
`<p><b>24 Corpus texts</b> … transcribed narratives, ethnographic texts and conversations: read the texts and search for words within the corpus texts; listen to selected texts </p>`.
The phrase "transcribed narratives, ethnographic texts and conversations" is within a single text
node. Good.

Also, the "…" ellipsis character: the text uses "…" (U+2026). Playwright normalizes whitespace, but
"…" is not whitespace. If I include "…" in the phrase, I need the exact character. It's safer to
pick phrases that don't straddle the "…".

Now, let me verify that the candidate phrases don't appear in the full About text. I'll also
double-check that the phrases don't collide with other UI text (menu items, etc.) — since I'm
scoping to the window's `.prose`, collisions with menu items are avoided.

Another consideration: the window title is "Welcome to TUNOCENT". The existing index.test.ts uses
`page.locator("div").filter({ hasText: /^Welcome to TUNOCENT$/ }).nth(1)` — this is fragile. The
vicav plan's pattern `.winbox` with `.wb-title` hasText is better. Let me confirm that winbox
renders the title with the `.wb-title` class — this is standard WinBox (the winbox npm package). The
vicav plan has already verified this. Let me quickly check the winbox version in package.json and
check the existing tunocent window-management.spec.ts to see the selectors being used.

The About text is clearly different — a good negative control. Verify that the candidate phrases
don't appear anywhere in the About document, and check the existing tunocent test conventions.

**Tool: bash**

**Input:**

```json
{
	"command": "curl -s \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocent_about\" -H \"Accept: application/xml\" -o \"$TEMP/tunocent_about.xml\" && node -e \"\nconst fs=require('fs'),os=require('os');\nconst t=fs.readFileSync(os.tmpdir()+'/tunocent_about.xml','utf8');\nconst phrases=[\n 'The TUNOCENT project',\n 'learn about the TUNOCENT-project, its team members',\n 'a questionnaire that focuses on grammatical and lexical variation',\n 'a text with seven sentences which provide details on everyday activities and duties',\n 'transcribed narratives, ethnographic texts and conversations',\n 'data list with speakers and the details of locations and data type',\n 'lists with publications, presentations and the conference we organised'\n];\nfor(const p of phrases) console.log((t.includes(p)?'PRESENT  ':'absent  ')+p);\nconsole.log('---about headings---');\nconsole.log([...t.matchAll(/<h[23][^>]*>([\\s\\S]*?)<\\/h[23]>/g)].map(m=>m[1].replace(/\\s+/g,' ').trim()).join(' | '));\n\"",
	"timeout": 60000
}
```

**Output:**

```
absent  The TUNOCENT project
absent  learn about the TUNOCENT-project, its team members
absent  a questionnaire that focuses on grammatical and lexical variation
absent  a text with seven sentences which provide details on everyday activities and duties
absent  transcribed narratives, ethnographic texts and conversations
absent  data list with speakers and the details of locations and data type
absent  lists with publications, presentations and the conference we organised
---about headings---
TUNOCENT | The Background | The Approach | Cooperations

```

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\e2e\\pages\\tunocent\\window-management.spec.ts"
}
```

**Output:**

```
<path>V:\vicav-vue3\e2e\pages\tunocent\window-management.spec.ts</path>
<type>file</type>
<content>
1: import { expect, test } from "@playwright/test";
2:
3: test.describe("Window Management", () => {
4: 	test.beforeEach(async ({ page }) => {
5: 		await page.goto("/");
6: 		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
7: 	});
8:
9: 	// eslint-disable-next-line playwright/expect-expect
10: 	test("TC-020: Window Arrangement - Cascade", async ({ page }) => {
11: 		await page.getByRole("button", { name: "Profiles" }).click();
12: 		await page.keyboard.press("ArrowDown");
13: 		await page.keyboard.press("Enter");
14:
15: 		await page.getByRole("button", { name: "Feature Lists", exact: true }).click();
16: 		await page.keyboard.press("ArrowDown");
17: 		await page.keyboard.press("Enter");
18:
19: 		await page.getByRole("menuitem", { name: /^Windows/ }).click();
20: 		await page.keyboard.press("ArrowDown");
21: 		await page.keyboard.press("Enter");
22: 	});
23:
24: 	// eslint-disable-next-line playwright/expect-expect
25: 	test("TC-021: Window Arrangement - Tile", async ({ page }) => {
26: 		await page.getByRole("button", { name: "Profiles" }).click();
27: 		await page.keyboard.press("ArrowDown");
28: 		await page.keyboard.press("Enter");
29:
30: 		await page.getByRole("button", { name: "Feature Lists", exact: true }).click();
31: 		await page.keyboard.press("ArrowDown");
32: 		await page.keyboard.press("Enter");
33:
34: 		await page.getByRole("menuitem", { name: /^Windows/ }).click();
35: 		await page.keyboard.press("ArrowDown");
36: 		await page.keyboard.press("ArrowDown");
37: 		await page.keyboard.press("Enter");
38: 	});
39:
40: 	// eslint-disable-next-line playwright/expect-expect
41: 	test("TC-022: Window Arrangement - Smart Tile", async ({ page }) => {
42: 		await page.getByRole("button", { name: "Profiles" }).click();
43: 		await page.keyboard.press("ArrowDown");
44: 		await page.keyboard.press("Enter");
45:
46: 		await page.getByRole("button", { name: "Feature Lists", exact: true }).click();
47: 		await page.keyboard.press("ArrowDown");
48: 		await page.keyboard.press("Enter");
49:
50: 		await page.getByRole("menuitem", { name: /^Windows/ }).click();
51: 		await page.keyboard.press("ArrowDown");
52: 		await page.keyboard.press("ArrowDown");
53: 		await page.keyboard.press("ArrowDown");
54: 		await page.keyboard.press("Enter");
55: 	});
56:
57: 	test("TC-023: Window Close", async ({ page }) => {
58: 		await page.getByRole("button", { name: "Profiles" }).click();
59: 		await page.keyboard.press("ArrowDown");
60: 		await page.keyboard.press("Enter");
61:
62: 		await expect(page.locator("main")).toBeVisible();
63: 	});
64: });

(End of file - total 64 lines)
</content>
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 42.2s)

_Thinking:_

Confirmed:

- None of the candidate phrases from the welcome text exist in the About text.
- The About heading is "TUNOCENT" (a different thing from "The TUNOCENT project").

Wait — one important check: the welcome heading is `<h2>The TUNOCENT project</h2>`. When asserting
with `hasText: /^The TUNOCENT project$/` against `.prose h2` — no problem.

But note: the About text's `<h2>` is "TUNOCENT" with whitespace around it. If we use
`getByText("The TUNOCENT project")` — the About text contains "TUNOCENT" but not "The TUNOCENT
project". Confirmed absent.

Next, let's also verify the winbox title class. Let me check the winbox package to confirm the
`.wb-title` class. WinBox is a well-known library, and its DOM is `.winbox` > `.wb-title` (a span
containing the title text). The vicav test plan has already verified the use of `.wb-title`. Just to
be safe, let me quickly check node_modules.

Also, I should re-check the `#window-root` id — `windowRootId` in the store. Let me grep for it.

All the candidate phrases have been confirmed to be absent from the About text. I'll verify the
winbox DOM class and the `windowRootId`, and additionally check the winbox package as well.

**Tool: grep**

**Input:**

```json
{
	"pattern": "windowRootId",
	"path": "V:\\vicav-vue3\\app"
}
```

**Output:**

```
Found 5 matches
V:\vicav-vue3\app\utils\constants.ts:
  Line 3: export const windowRootId = "window-root";


V:\vicav-vue3\app\stores\use-windows-store.ts:
  Line 118: 		const rootElement = document.getElementById(windowRootId);

  Line 359: 		const rootElement = document.getElementById(windowRootId);

  Line 406: 		const rootElement = document.getElementById(windowRootId);


V:\vicav-vue3\app\components\window-manager.client.vue:
  Line 23: 		:id="windowRootId"

```

**Tool: bash**

**Input:**

```json
{
	"command": "node -e \"\nconst fs=require('fs');\ntry {\n  const p=fs.readFileSync('node_modules/winbox/dist/winbox.js','utf8');\n  const m=p.match(/wb-title|winbox[^\\\"']*/g);\n  console.log([...new Set(m||[])].slice(0,20).join('\\n'));\n} catch(e){ console.log('winbox dist not found:', e.message); }\n\" ; grep -n \"\\\"winbox\\\"\" package.json",
	"timeout": 30000
}
```

**Output:**

```
winbox dist not found: ENOENT: no such file or directory, open 'V:\vicav-vue3\node_modules\winbox\dist\winbox.js'
113:		"winbox": "^0.2.82",

```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 912.0s)

_Thinking:_

winbox 0.2.82 — the DOM uses `.winbox`, `.wb-title`, `.wb-body`, `.wb-close`, `.wb-focus` (focus
class is `focus`). Good.

Now I have everything I need. Let me delegate to the playwright-test-planner agent to produce the
plan, as the user explicitly requested. I'll give it full context: the verified facts (backend URLs,
the tunocentOpeningPage text content, the window mechanism, selectors, conventions from
docs/tests.md and the vicav text-window-display plan as a template). I'll ask it to produce a plan
for ONE test (with a negative control as a sub-assertion or second test), and return the full plan
markdown in its final message — and explicitly NOT to write any files (plan mode is read-only).

Actually — should the planner write the spec file? The user said "Use @playwright-test-planner to
plan a test." In plan mode I cannot write files. The planner agent, if it writes files, would
violate plan mode. I'll instruct it to research and return the plan as text only, no file writes.
Then I present the plan to the user for approval. After approval, implementation writes the spec +
test file.

Let me launch the planner agent with comprehensive context.

I have all the verified facts I need. Now delegating to the playwright-test-planner agent to produce
the test plan.

**Tool: task**

**Input:**

```json
{
	"description": "Plan tunocent text-window test",
	"subagent_type": "playwright-test-planner",
	"prompt": "Plan ONE Playwright E2E test (plus one negative-control test) for the VICAV Vue3/Nuxt app (repo root V:\\vicav-vue3). Do NOT write or modify any files — you are in plan-only mode. Return the complete plan as markdown in your final message, following the format of the existing plan at V:\\vicav-vue3\\specs\\text-window-display-test-plan.md (read it first as the template: application overview, test scenarios with numbered steps + expected results, selector reference table, execution matrix, running instructions, fragility table, success criteria).\n\nGOAL: Verify that on FIRST load of \"/\" on the TUNOCENT instance, the default restored window displays its initial text content (loading resolved, content rendered), and assert on a few specific lines/phrases to prove the CORRECT text (textId tunocentOpeningPage) was loaded — not a wrong/placeholder text.\n\nVERIFIED FACTS (already researched — trust these, do not re-verify):\n1. Backend selection: env var NUXT_PUBLIC_API_BASE_URL=\"https://tunocent-api.acdh-dev.oeaw.ac.at\" selects the tunocent backend (playwright.config.ts maps it to backend \"tunocent\" and sets testMatch to \"tunocent/**/*.@(test|spec).ts\"). Tests live under e2e/pages/tunocent/.\n2. On first load of \"/\", app/stores/use-windows-store.ts initializeScreen() reads projectConfig.panel from GET /vicav/project and restores those windows via WinBox. For TUNOCENT the panel array contains exactly ONE window: { id: \"tunocentWelcome\", title: \"Welcome to TUNOCENT\", targetType: \"Text\", params: { textId: \"tunocentOpeningPage\", teiSource: \"https://github.com/acdh-oeaw/tunocent-content/blob/.../vicav_texts/tunocent_opening_page.xml\" } }.\n3. window-content.vue routes targetType \"Text\" to text-window-content.vue, which calls useTextById → GET {apiBase}/vicav/text?id=tunocentOpeningPage with Accept: application/xml, retry:false, and renders the returned HTML string into `<div v-if=\"data\" class=\"prose max-w-3xl p-8\" v-html=\"data\">`. While isPending||isPlaceholderData the wrapper div gets classes \"opacity-50 grayscale\" and a centered LoadingIndicator is shown (svg containing <title>Loading...</title> — see app/components/ui/loading-indicator.vue).\n4. WinBox DOM (winbox 0.2.82): each window is a `.winbox` element inside `#window-root` (id constant windowRootId in app/utils/constants.ts); title element is `.wb-title`, content is teleported into `.wb-body`, close button `.wb-close`. On first load the LAST restored window holds focus, so scope by `.wb-title` text, never `.winbox.focus`.\n5. Suite conventions (docs/tests.md + specs/text-window-display-test-plan.md): every test first awaits `expect(page.locator(\"#window-root\")).toBeInViewport({ timeout: 30000 })` (hydration gate — clicks before hydration are silently dropped). Scope ALL content assertions to the specific window's `.prose` — never page-wide getByText (locator name collisions with map layer buttons / menu items). NavigationMenu triggers: click then wait for `[data-slot=navigation-menu-content]` visible; close with Escape. Playwright normalizes whitespace, so phrases span source line breaks fine. Tests hit the LIVE backend, so content assertions can break on backend content changes (document this).\n6. LIVE BACKEND CONTENT VERIFIED 2026-09-02 (curl of /vicav/text?id=tunocentOpeningPage, Accept: application/xml). Full text:\n   - h2: \"The TUNOCENT project\"\n   - p: \"**About** … team members, news section: learn about the TUNOCENT-project, its team members and activities\"\n   - p: \"**71 Profiles** … geography, history and most notable sights of the research locations; demographics, the inhabitants' prevalent way of life and main means of income: get an impression of the different localities; get an insight into the way people live by viewing the photos\"\n   - p: \"**195 Feature lists** … a questionnaire that focuses on grammatical and lexical variation: get an impression of a specific variety; compare the linguistic features in various locations; filter the data by a number of categories, such as place, feature, and speaker\"\n   - p: \"**185 Sample texts** … a text with seven sentences which provide details on everyday activities and duties: compare linguistic characteristics contained in the texts; filter the data by a number of categories, such as place, sentence number, and speaker\"\n   - p: \"**24 Corpus texts** … transcribed narratives, ethnographic texts and conversations: read the texts and search for words within the corpus texts; listen to selected texts\"\n   - p: \"**Browse data** (with 2683 entries) … data list with speakers and the details of locations and data type: get an impression of the immense amount of linguistic data we collected; filter the list of speakers and recordings by a number of categories, such as place, age, gender and data type\"\n   - p: \"**Research** … lists with publications, presentations and the conference we organised; get an impression of our research activities and the various topics we addressed\"\n   NOTE: the numbers (71/195/185/24/2683) are data counts and may drift over time — do NOT assert on the numbers themselves; assert on the stable descriptive phrases after the ellipsis.\n7. NEGATIVE CONTROL VERIFIED: the \"About\" menu item (About > About, targetType Text, textId tunocent_about) renders a DIFFERENT text whose h2 is \"TUNOCENT\" and which contains \"(April 2019 → September 2024)\" / \"funded by The Austrian Science Fund (FWF)\". I verified NONE of the tunocentOpeningPage phrases (\"The TUNOCENT project\", \"learn about the TUNOCENT-project\", \"a questionnaire that focuses on grammatical and lexical variation\", \"transcribed narratives, ethnographic texts and conversations\", etc.) appear in tunocent_about. So opening About and asserting the welcome phrases are ABSENT proves the assertions are specific to tunocentOpeningPage. Tunocent menu main items (verified from live project config): About, Profiles, Feature Lists, Sample Texts, Corpus Texts, Browse data, Research. About dropdown items: \"About\", \"Team\", \"News\".\n8. Existing tunocent tests: e2e/pages/tunocent/index.test.ts (\"should show initial windows\" currently only checks a div with text /^Welcome to TUNOCENT$/ is visible — our new test goes beyond this by asserting rendered text content). New test file should follow the naming style; suggest e2e/pages/tunocent/text-window-display.test.ts with header comment `// spec: specs/tunocent-text-window-display-test-plan.md`.\n9. Running: .env.local sets NUXT_PUBLIC_API_BASE_URL=\"https://tunocent-api.acdh-dev.oeaw.ac.at\"; `pnpm run build` then `pnpm run test:e2e text-window-display` (npm scripts inject env via dotenv -e .env.local). Kill stale server on :3000 before switching backends (reuseExistingServer true locally). Browsers: chromium/firefox/webkit desktop projects.\n10. If a content assertion ever fails, triage by curling the live endpoint first (curl -s -H \"Accept: application/xml\" \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocentOpeningPage\") to distinguish backend content change from frontend regression.\n\nProduce the plan with: (a) one primary test \"First-load Welcome window renders the tunocentOpeningPage text\" with steps: goto /, hydration gate, locate the Welcome window by .wb-title text, assert .prose visible, assert LoadingIndicator gone, assert 3-4 specific phrases (heading \"The TUNOCENT project\" + 2-3 stable body phrases from item 6, scoped to the window's .prose); (b) one negative-control test \"About window does not contain the welcome phrases\" (open About > About via menu, assert welcome phrases absent, assert its own h2 \"TUNOCENT\" present). Include the selector reference table, execution matrix, running instructions, fragility table (mark which phrases are stable vs which numbers are volatile and intentionally unasserted), and success criteria. Keep it concise and consistent with the vicav plan's structure."
}
```

**Output:**

````
<task id="ses_f9bd5e650ffeebJh2dCTErjcUJ" state="completed">
<task_result>
I have everything needed: the vicav template format, suite conventions from docs/tests.md, the existing tunocent test style, and all verified facts. Here is the complete plan (plan-only — no files written; ready to save as `specs/tunocent-text-window-display-test-plan.md`):

---

# TUNOCENT First-Load Text Window Display Test Plan

## Application Overview

Prompt: "Make sure a text in a window is displayed when the site is loaded first. Check some of the
content of the text to verify it loaded the correct text."

Application under test: TUNOCENT instance of VICAV3.0 (Vue 3/Nuxt, Winbox window manager). Base URL
http://localhost:3000 (Playwright webServer via `pnpm run start:local`). Backend: tunocent —
`.env.local` must set `NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"`;
`playwright.config.ts` maps this URL to backend `tunocent` and sets
`testMatch: "tunocent/**/*.@(test|spec).ts"` (tests live under `e2e/pages/tunocent/`; kill stale
servers on :3000 before switching backends).

Goal: on FIRST load of `/` the app restores the project config's default panel —
`app/stores/use-windows-store.ts` `initializeScreen()` reads `projectConfig.panel` from
`GET /vicav/project` and restores those windows via Winbox. For TUNOCENT the panel contains exactly
ONE window: `{ id: "tunocentWelcome", title: "Welcome to TUNOCENT", targetType: "Text", params:
{ textId: "tunocentOpeningPage", teiSource: "https://github.com/acdh-oeaw/tunocent-content/.../vicav_texts/tunocent_opening_page.xml" } }`.
The existing test `e2e/pages/tunocent/index.test.ts` ("should show initial windows") only asserts a
div with text `/^Welcome to TUNOCENT$/` is visible (title level). This plan goes beyond it: (1)
verify the text content inside the Welcome window is actually displayed (loading indicator gone,
`.prose` content rendered), and (2) assert on specific phrases of the rendered text to prove the
CORRECT text (textId `tunocentOpeningPage`) was loaded — not a wrong/placeholder text.

How Text windows render (verified): `window-content.vue` routes targetType Text to
`text-window-content.vue`, which fetches via `useTextById` (GET `{apiBase}/vicav/text?id=tunocentOpeningPage`,
Accept: application/xml, retry:false) and renders the returned HTML string into
`<div v-if="data" class="prose max-w-3xl p-8" v-html="data">`. While `isPending||isPlaceholderData`
the wrapper div gets `opacity-50 grayscale` and a centered LoadingIndicator (svg with
`<title>Loading...</title>`, `app/components/ui/loading-indicator.vue`) is shown. Winbox 0.2.82 DOM:
each window is a `.winbox` inside `#window-root` (id constant `windowRootId`,
`app/utils/constants.ts`), title in `.wb-title`, content teleported into `.wb-body`, close button
`.wb-close`. On first load the LAST restored window holds focus, so scope to the window by its
`.wb-title` text — do NOT use `.winbox.focus` (here the panel has exactly one window, but title
scoping is the suite convention).

Verified live backend content (curl, 2026-09-02, `/vicav/text?id=tunocentOpeningPage`):
`<h2>The TUNOCENT project</h2>` followed by 8 paragraphs, each with a bold lead ("**About**",
"**71 Profiles**", "**195 Feature lists**", "**185 Sample texts**", "**24 Corpus texts**",
"**Browse data** (with 2683 entries)", "**Research**") and a stable descriptive tail after the
ellipsis. The numbers (71/195/185/24/2683) are live data counts and DRIFT over time — they are
intentionally NOT asserted; only the stable descriptive phrases are.

Negative control (verified 2026-09-02): the "About" menu item (About > About, targetType Text,
textId `tunocent_about`) renders a DIFFERENT text whose h2 is "TUNOCENT" and which contains
"(April 2019 → September 2024)" / "funded by The Austrian Science Fund (FWF)". None of the
`tunocentOpeningPage` phrases asserted below ("The TUNOCENT project", "learn about the
TUNOCENT-project", "a questionnaire that focuses on grammatical and lexical variation",
"transcribed narratives, ethnographic texts and conversations") appear in `tunocent_about`.
Tunocent main menu items (live project config): About, Profiles, Feature Lists, Sample Texts,
Corpus Texts, Browse data, Research. About dropdown items: "About", "Team", "News".

Suite conventions (docs/tests.md + specs/text-window-display-test-plan.md): every test first
`await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })` (hydration gate —
clicks before hydration are silently dropped). Content assertions are scoped to the specific
window's `.prose`, never page-wide `getByText` (locator name collisions with map layer buttons /
menu items). NavigationMenu: wait for `[data-slot=navigation-menu-content]` visible after trigger
click (hover-debounce swallows the click); close with Escape. Playwright normalizes whitespace, so
phrases match even though the backend HTML contains source line breaks. Tests run against the LIVE
backend — content assertions can break when backend content changes, not frontend code.

Test file: `e2e/pages/tunocent/text-window-display.test.ts` (new file, header comment
`// spec: specs/tunocent-text-window-display-test-plan.md`). Run: `pnpm run build` then
`pnpm run test:e2e text-window-display`.

## Test Scenarios

### 1. First-load Welcome window rendering

**Seed:** `e2e/seed.spec.ts`

#### 1.1. First-load Welcome window renders the tunocentOpeningPage text

**File:** `e2e/pages/tunocent/text-window-display.test.ts`

**Steps:**

1. Purpose: on first load of "/", the restored Welcome Text window (the ONLY default panel window
   for TUNOCENT) must render its text content, must not remain stuck on the loading indicator, and
   the rendered content must provably be textId `tunocentOpeningPage`. Preconditions: `.env.local`
   sets `NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"`; app built
   (`pnpm run build`); tests run via `pnpm run test:e2e` against the webServer on
   http://localhost:3000.
2. Navigate: `await page.goto("/")`

   - expect: Page loads (document title "Home | TUNOCENT - Tunisia's Linguistic terra incognita…")

3. Hydration gate (mandatory suite convention — clicks before hydration are silently dropped):
   `await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })`

   - expect: App hydrated and the default panel window (Welcome to TUNOCENT) restored

4. Locate the Welcome window by title (NOT `.winbox.focus` — on first load the last restored window
   holds focus): `const welcome = page.locator(".winbox", { has: page.locator(".wb-title", {
   hasText: /^Welcome to TUNOCENT$/ }) })`

   - expect: Exactly one `.winbox` matches (the TUNOCENT panel contains exactly one window) and it
     is visible: `expect(welcome).toHaveCount(1)`; `await expect(welcome).toBeVisible()`

5. `await expect(welcome.locator(".prose")).toBeVisible({ timeout: 15000 })`

   - expect: The content container `div.prose` (`v-if="data"`) is rendered once
     `GET /vicav/text?id=tunocentOpeningPage` resolves — the text is displayed, not an empty or
     spinner-only window

6. `await expect(welcome.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ })
   })).not.toBeVisible()`

   - expect: The centered LoadingIndicator (svg with `<title>Loading...</title>`) is gone —
     `isPending`/`isPlaceholderData` are both false

7. Optional: `await expect(welcome.locator(".wb-body > div")).not.toHaveClass(/opacity-50/)`

   - expect: The loading dim classes (`opacity-50 grayscale`) are removed from the content wrapper
     div once data loaded

8. Heading assertion: `await expect(welcome.locator(".prose h2", { hasText: /^The TUNOCENT
   project$/ })).toBeVisible()`

   - expect: The `tunocentOpeningPage` document heading `<h2>The TUNOCENT project</h2>` is present
     — this heading is unique to this text

9. Stable body phrase 1 (About paragraph): `await expect(welcome.locator(".prose").getByText("learn
   about the TUNOCENT-project, its team members and activities")).toBeVisible()`

   - expect: The stable tail of the "About" paragraph is present

10. Stable body phrase 2 (Feature lists paragraph): `await expect(welcome.locator(".prose")
    .getByText("a questionnaire that focuses on grammatical and lexical variation")).toBeVisible()`

    - expect: The stable tail of the "Feature lists" paragraph is present

11. Stable body phrase 3 (Corpus texts paragraph): `await expect(welcome.locator(".prose")
    .getByText("transcribed narratives, ethnographic texts and conversations")).toBeVisible()`

    - expect: The stable tail of the "Corpus texts" paragraph is present

12. Notes: all content assertions are scoped to the Welcome window's `.prose` — never page-wide
    `getByText` (locator name collisions with menu items and map layer buttons). Phrases are
    contiguous within a single paragraph and Playwright normalizes whitespace (backend HTML
    contains source line breaks). The data counts (71/195/185/24/2683) are VOLATILE and
    intentionally NOT asserted. These are live-backend CONTENT assertions: stable project
    documentation, but they break if the backend rewrites the opening page (content change, not
    frontend bug).

13. Failure conditions: `.prose` never visible within 15s, or LoadingIndicator still visible after
    data should have arrived, or any phrase missing.

    - expect: Test fails if `.prose` never appears (text fetch failed — `useTextById` has
      retry:false, a failed request leaves the window empty with the spinner), if the indicator
      persists (query stuck pending/placeholder), or if a phrase is absent (wrong textId loaded, or
      backend content change — triage per §7)

### 2. Assertion specificity (negative control)

**Seed:** `e2e/seed.spec.ts`

#### 2.1. About window does not contain the welcome phrases

**File:** `e2e/pages/tunocent/text-window-display.test.ts`

**Steps:**

1. Purpose: prove the content assertions of test 1.1 are specific enough to catch a WRONG textId —
   a window loading a different text must not contain the welcome phrases. Uses About > About
   (targetType Text, textId `tunocent_about`), verified 2026-09-02 to contain none of the
   `tunocentOpeningPage` phrases (its h2 is "TUNOCENT"; it contains "(April 2019 → September 2024)"
   and "funded by The Austrian Science Fund (FWF)" instead).
2. Navigate to "/" and pass the hydration gate: `await
   expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })`

   - expect: Default Welcome window restored

3. Open the About menu: `await page.locator("[data-slot=navigation-menu-list]").getByRole("button",
   { name: "About", exact: true }).click(); await expect(page.locator("[data-slot=navigation-menu-content]")).toBeVisible()`

   - expect: The About dropdown opens (NavigationMenu hover-debounce: wait for the content element
     — do not assume the click toggled it; an open menu cannot be closed by clicking its trigger)

4. `await page.locator("[data-slot=navigation-menu-content]").getByRole("button", { name: "About",
   exact: true }).click()`

   - expect: An About window opens (targetType Text, textId `tunocent_about`). `exact: true`
     matters — the dropdown items are "About", "Team", "News"

5. Locate the About window: `const about = page.locator(".winbox", { has: page.locator(".wb-title",
   { hasText: /^About$/ }) })`; `await expect(about.locator(".prose")).toBeVisible({ timeout: 15000 })`

   - expect: The About text rendered (window not empty). ASSUMPTION: the window title equals the
     menu item name ("About"), per suite convention (cf. vicav "Contributors"). Fallback if the
     live title differs: scope by content — `page.locator(".winbox", { has: page.locator(".prose
     h2", { hasText: /^TUNOCENT$/ }) })` (the Welcome window's h2 "The TUNOCENT project" does not
     exact-match, so the fallback is unambiguous)

6. Positive control — the window shows its OWN heading: `await expect(about.locator(".prose h2", {
   hasText: /^TUNOCENT$/ })).toBeVisible()`

   - expect: A different text was loaded (h2 "TUNOCENT", not "The TUNOCENT project")

7. `await expect(about.locator(".prose h2", { hasText: /^The TUNOCENT project$/ })).toHaveCount(0)`

   - expect: The welcome heading is ABSENT from the About window

8. `await expect(about.locator(".prose").getByText("learn about the TUNOCENT-project")).toHaveCount(0)`

   - expect: Welcome phrase 1 is ABSENT from the About window

9. `await expect(about.locator(".prose").getByText("a questionnaire that focuses on grammatical and
   lexical variation")).toHaveCount(0)`

   - expect: Welcome phrase 2 is ABSENT from the About window

10. `await expect(about.locator(".prose").getByText("transcribed narratives, ethnographic texts and
    conversations")).toHaveCount(0)`

    - expect: Welcome phrase 3 is ABSENT from the About window

11. Optional positive control: `await expect(about.locator(".prose").getByText("funded by The
    Austrian Science Fund (FWF)")).toBeVisible()`

    - expect: A phrase unique to `tunocent_about` is present — the window really loaded the About
      text (not an empty/error window, which would vacuously pass the absence assertions)

12. Close the dropdown with `await page.keyboard.press("Escape")` if still open (an open
    NavigationMenu cannot be closed by clicking its trigger)

---

## 4. Selector Reference

| Target                             | Suggested selector                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hydration gate (every test, first) | `page.locator("#window-root")` — `toBeInViewport({ timeout: 30000 })`                                                                                 |
| Welcome window                     | `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^Welcome to TUNOCENT$/ }) })`                                                  |
| About window                       | `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^About$/ }) })` (assumption; fallback: scope by `.prose h2` `/^TUNOCENT$/`)   |
| Text content container             | `<winbox>.locator(".prose")` (only in DOM once data loaded, `v-if="data"`)                                                                            |
| Loading indicator                  | `<winbox>.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ }) })` (LoadingIndicator renders `<title>Loading...</title>`)       |
| Loading dim classes                | `<winbox>.locator(".wb-body > div")` — must NOT match `/opacity-50/` (component adds `opacity-50 grayscale` while `isPending \|\| isPlaceholderData`) |
| Welcome heading                    | `<welcome>.locator(".prose h2", { hasText: /^The TUNOCENT project$/ })`                                                                               |
| About heading                      | `<about>.locator(".prose h2", { hasText: /^TUNOCENT$/ })`                                                                                             |
| About menu trigger                 | `page.locator("[data-slot=navigation-menu-list]").getByRole("button", { name: "About", exact: true })`                                               |
| Open menu content                  | `page.locator("[data-slot=navigation-menu-content]")` (wait for visible after trigger click)                                                          |
| About menu item                    | `page.locator("[data-slot=navigation-menu-content]").getByRole("button", { name: "About", exact: true })` (items: About, Team, News)                 |
| Window close button                | `<winbox>.locator(".wb-close")` (scoped per window, not `.first()` page-wide)                                                                         |

Notes:

- Scope every content assertion to the specific window's `.prose` — never page-wide `getByText`
  (locator name collisions: menu items and map layer buttons can contain colliding strings; see
  "Locator name collisions" in docs/tests.md).
- Do NOT scope to `.winbox.focus` on first load: Winbox moves focus into the last restored window.
  (`.winbox.focus .wb-title` is only valid after explicitly focusing a window, e.g. via the Windows
  dropdown.)
- Windows may overlap on small viewports; Playwright visibility is CSS-based (not occlusion), so
  DOM-scoped assertions are unaffected.
- Playwright normalizes whitespace, so phrases match even though the backend HTML contains source
  line breaks.
- NavigationMenu trigger clicks are swallowed by design (hover debounce); always wait for
  `[data-slot=navigation-menu-content]` visible, and close with Escape.

---

## 5. Test Execution Matrix

| Test ID       | Test case                                              | Suite | Priority | Fragility                                                                                          |
| ------------- | ------------------------------------------------------ | ----- | -------- | -------------------------------------------------------------------------------------------------- |
| TUNO-TEXT-001 | First-load Welcome window renders tunocentOpeningPage  | 1.1   | Critical | Content (stable opening-page phrases); structural parts (`.prose`, indicator) are stable           |
| TUNO-TEXT-002 | About window does not contain the welcome phrases      | 2.1   | High     | Content (absence assertions); About window title is an assumption (fallback locator provided)      |

Browsers: chromium, firefox, webkit (all three desktop projects in playwright.config.ts). Viewport:
default desktop (1280x720).

---

## 6. Running the Tests

```bash
# .env.local (gitignored) — required, dotenv -e wrapper fails without it
NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"

pnpm run build          # PUBLIC vars are read at server start; rebuild only if code changed
pnpm run test:e2e       # all tunocent tests (webServer: pnpm run start:local on :3000)
pnpm run test:e2e text-window-display   # only this plan's tests
````

- Kill any stale server on port 3000 before switching backends
  (`webServer.reuseExistingServer: true` locally).
- CI: 1 worker, 2 retries, `forbidOnly` on.
- Test file header convention: `// spec: specs/tunocent-text-window-display-test-plan.md`.

---

## 7. Live-Backend Fragility (stable vs volatile)

Tests hit the real backend, so they can break when backend **content** changes rather than frontend
code (docs/tests.md).

| Assertion                                                                                                       | Stability                                               | Breaks when                                                                      |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Window title "Welcome to TUNOCENT"                                                                              | Stable                                                  | Project config changes panel windows                                             |
| `.prose` rendered, LoadingIndicator gone (TUNO-TEXT-001)                                                        | Stable (structural)                                     | Frontend regression or text fetch failure (retry:false → empty window + spinner) |
| Data counts 71 / 195 / 185 / 24 / 2683                                                                          | **Volatile** — live data counts drift                   | Any data update → therefore intentionally NOT asserted                           |
| Welcome h2 "The TUNOCENT project"                                                                               | Stable (project documentation)                          | Backend rewrites the opening page                                                |
| Welcome phrases "learn about the TUNOCENT-project…", "a questionnaire that focuses…", "transcribed narratives…" | Stable (core descriptive copy)                          | Backend rewrites the opening page                                                |
| About window title "About"                                                                                      | Assumed (equals menu item name)                         | Backend sets a different window title → use the fallback locator (§4)            |
| About h2 "TUNOCENT" (TUNO-TEXT-002)                                                                             | Stable                                                  | Backend rewrites the About text                                                  |
| TUNO-TEXT-002 absence assertions                                                                                | Stable while `tunocent_about` keeps its current wording | About text gains the welcome phrases (unlikely)                                  |

**Triage rule:** if a content assertion fails, first re-verify the live content before assuming a
frontend bug:

```bash
curl -s -H "Accept: application/xml" "https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocentOpeningPage"
curl -s -H "Accept: application/xml" "https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocent_about"
```

If the phrases are still in the response, the failure is a frontend regression
(fetch/render/loading-state); if they are gone, update the spec's phrases to the new stable wording
(never assert on the drifting data counts).

---

## 8. Success Criteria

- On first load of `/`, the restored Welcome window (the only default panel window for TUNOCENT)
  displays its text content: `.prose` rendered, LoadingIndicator gone, no `opacity-50` dimming.
- The Welcome window's rendered content provably belongs to textId `tunocentOpeningPage` (unique
  heading "The TUNOCENT project" + three stable body phrases), without coupling the test to the
  volatile data counts.
- The About window (different textId `tunocent_about`, opened via About > About) provably does NOT
  contain the welcome phrases and shows its own h2 "TUNOCENT" — the assertions are specific to
  `tunocentOpeningPage`, so a wrong/placeholder textId would fail the test. </task_result> </task>

````

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 84.0s)

_Thinking:_

The planner has created a complete plan. Next, I should present a concise plan to the user and ask for approval with ExitPlanMode. The plan is long, but I should summarize it concisely. The user asked to "plan the tests" — the deliverable is the plan. In plan mode, I present the plan and request approval for implementation.

Should I write the spec file? In plan mode, I can't write. After approval, the implementation phase would be: write specs/tunocent-text-window-display-test-plan.md and e2e/pages/tunocent/text-window-display.test.ts, then build + run the tests.

Let me present a concise plan and use ExitPlanMode. The ExitPlanMode tool takes a `plan` parameter. I'll write a concise yet complete plan there.


The planner agent has produced the plan based on my verified research. Here's the summary:

**Research findings (verified against live tunocent backend):**
- TUNOCENT's default panel (from `GET /vicav/project`) is exactly **one** window: "Welcome to TUNOCENT", `targetType: Text`, `textId: tunocentOpeningPage`
- The live text (fetched via `/vicav/text?id=tunocentOpeningPage`) contains stable phrases: h2 "The TUNOCENT project", "learn about the TUNOCENT-project, its team members and activities", "a questionnaire that focuses on grammatical and lexical variation", "transcribed narratives, ethnographic texts and conversations"
- Data counts (71/195/185/24/2683) are volatile → intentionally not asserted
- Negative control verified: `tunocent_about` (About menu) contains **none** of those phrases (its h2 is "TUNOCENT", mentions FWF funding)



**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "The test plan is ready (full plan produced by @playwright-test-planner). How should I proceed with implementation once approved?",
      "header": "Scope",
      "options": [
        {
          "label": "Plan + test file + run (Recommended)",
          "description": "Write specs/tunocent-text-window-display-test-plan.md, create e2e/pages/tunocent/text-window-display.test.ts (2 tests), then build and run the tests against the tunocent backend to verify they pass"
        },
        {
          "label": "Plan + test file only",
          "description": "Write the spec file and the test file, but don't build/run — you'll run the tests yourself"
        },
        {
          "label": "Plan document only",
          "description": "Only write specs/tunocent-text-window-display-test-plan.md; you'll implement the test later"
        }
      ]
    }
  ]
}
````

**Output:**

```
User has answered your questions: "The test plan is ready (full plan produced by @playwright-test-planner). How should I proceed with implementation once approved?"="Plan document only". You can now continue with the user's answers in mind.
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 13.4s)

_Thinking:_

The user selected "Plan document only" — so once approved, I'll just write
specs/tunocent-text-window-display-test-plan.md. Next, I'll call ExitPlanMode with the plan.

**Tool: task**

**Input:**

```json
{
	"description": "Exit plan mode with plan",
	"prompt": "Plan approved scope: write ONLY the plan document specs/tunocent-text-window-display-test-plan.md (no test file, no build/run).",
	"subagent_type": "exit"
}
```

**Error:**

```
Unknown agent type: exit is not a valid agent type
```

---

## Assistant (Plan · Qwen3.8 27B Q4_0 · 78.5s)

_Thinking:_

There is no exit agent. The workflow states that the ExitPlanMode tool should be used, but it
doesn't exist in my function list. The available tools are: bash, edit, question, read, skill, task,
webfetch, write. There is no ExitPlanMode tool. Hmm. The system prompt mentions ExitPlanMode, but
it's not included in the provided function schema.

Since the ExitPlanMode tool isn't available, I should present the plan as the final message. The
plan mode reminder says to build the plan and present it. Since I can't call ExitPlanMode, I'll
present the complete plan as text. The user will probably approve it through the UI.

Let me present the plan concisely and completely. The plan is long, but as a plan document it's
fine. Since the user only wants the plan document, the final deliverable after approval is that
markdown file. I'll present the plan content (the planner's output) and note that after approval
I'll write it to specs/tunocent-text-window-display-test-plan.md.

# Plan: TUNOCENT First-Load Text Window Display Test

## Context

- On first load of `/`, `use-windows-store.ts` `initializeScreen()` restores the project config's
  panel windows. For TUNOCENT (`NUXT_PUBLIC_API_BASE_URL=https://tunocent-api.acdh-dev.oeaw.ac.at`)
  that's exactly **one** window: "Welcome to TUNOCENT" (`targetType: Text`,
  `textId: tunocentOpeningPage`).
- `window-content.vue` routes `Text` → `text-window-content.vue` → `useTextById` (GET
  `/vicav/text?id=...`, Accept: application/xml, `retry: false`) → renders HTML into
  `<div v-if="data" class="prose max-w-3xl p-8">`. While pending, wrapper gets
  `opacity-50 grayscale` + LoadingIndicator (svg `<title>Loading...</title>`).
- Verified live backend content (curl, today) of `tunocentOpeningPage`: h2 "The TUNOCENT project" +
  8 paragraphs. Stable phrases chosen (data counts 71/195/185/24/2683 are volatile → **not**
  asserted):
  1. h2 `The TUNOCENT project`
  2. `learn about the TUNOCENT-project, its team members and activities`
  3. `a questionnaire that focuses on grammatical and lexical variation`
  4. `transcribed narratives, ethnographic texts and conversations`
- Negative control verified: `tunocent_about` (About > About) contains **none** of these phrases
  (its h2 is "TUNOCENT"; mentions FWF funding).

## Deliverable (per your choice: plan document only)

Create `specs/tunocent-text-window-display-test-plan.md` following the format of
`specs/text-window-display-test-plan.md`, containing:

1. **Application overview** — tunocent backend selection via `playwright.config.ts` testMatch,
   single default panel window, rendering pipeline, live content verified 2026-09-02.
2. **Test scenario 1.1 (primary, Critical)** — `e2e/pages/tunocent/text-window-display.test.ts`:
   - `goto("/")` → hydration gate
     `expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })`
   - Locate window:
     `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^Welcome to TUNOCENT$/ }) })`;
     assert count 1 + visible
   - `expect(welcome.locator(".prose")).toBeVisible({ timeout: 15000 })` (content rendered)
   - LoadingIndicator gone:
     `welcome.locator("svg").filter({ has: title /Loading/ }).not.toBeVisible()`
   - Optional: `.wb-body > div` not matching `/opacity-50/`
   - Content assertions scoped to `.prose`: h2 + the 3 stable phrases above
3. **Test scenario 2.1 (negative control, High)** — open About menu
   (`[data-slot=navigation-menu-list]` button "About" exact → wait for
   `[data-slot=navigation-menu-content]` → click item "About" exact), locate About window
   (`.wb-title` /^About$/, fallback: scope by `.prose h2` /^TUNOCENT$/), assert its own h2
   "TUNOCENT" present, and all 3 welcome phrases + welcome h2 have `toHaveCount(0)`; optional
   positive control "funded by The Austrian Science Fund (FWF)"; close menu with Escape.
4. **Selector reference table, execution matrix (TUNO-TEXT-001/002, chromium/firefox/webkit),
   running instructions** (`.env.local` with tunocent URL, `pnpm run build`,
   `pnpm run test:e2e text-window-display`, kill stale :3000 server), **fragility table** (stable
   phrases vs volatile counts; triage via curl), and **success criteria**.

No test file, no build/run — only the spec document will be written.

**Tool: question**

**Input:**

```json
{
	"questions": [
		{
			"question": "Approve writing specs/tunocent-text-window-display-test-plan.md as described above?",
			"header": "Approve plan",
			"options": [
				{
					"label": "Approve (Recommended)",
					"description": "Write the plan document to specs/tunocent-text-window-display-test-plan.md"
				},
				{
					"label": "Adjust first",
					"description": "Tell me what to change in the plan before writing"
				}
			]
		}
	]
}
```

**Error:**

```
The user dismissed this question
```

---

## User

write the spec document.

---

## Assistant (Build · Qwen3.8 27B Q4_0 · 513.3s)

_Thinking:_

The user approved: write the specification document. Based on the planner's output, I'll write
specs/tunocent-text-window-display-test-plan.md.

**Tool: write**

**Input:**

````json
{
	"filePath": "V:\\vicav-vue3\\specs\\tunocent-text-window-display-test-plan.md",
	"content": "# TUNOCENT First-Load Text Window Display Test Plan\n\n## Application Overview\n\nPrompt: \"Make sure a text in a window is displayed when the site is loaded first. Check some of the\ncontent of the text to verify it loaded the correct text.\"\n\nApplication under test: TUNOCENT instance of VICAV3.0 (Vue 3/Nuxt, Winbox window manager). Base URL\nhttp://localhost:3000 (Playwright webServer via `pnpm run start:local`). Backend: tunocent —\n`.env.local` must set `NUXT_PUBLIC_API_BASE_URL=\"https://tunocent-api.acdh-dev.oeaw.ac.at\"`;\n`playwright.config.ts` maps this URL to backend `tunocent` and sets\n`testMatch: \"tunocent/**/*.@(test|spec).ts\"` (tests live under `e2e/pages/tunocent/`; kill stale\nservers on :3000 before switching backends).\n\nGoal: on FIRST load of `/` the app restores the project config's default panel —\n`app/stores/use-windows-store.ts` `initializeScreen()` reads `projectConfig.panel` from\n`GET /vicav/project` and restores those windows via Winbox. For TUNOCENT the panel contains exactly\nONE window: `{ id: \"tunocentWelcome\", title: \"Welcome to TUNOCENT\", targetType: \"Text\", params:\n{ textId: \"tunocentOpeningPage\", teiSource: \"https://github.com/acdh-oeaw/tunocent-content/.../vicav_texts/tunocent_opening_page.xml\" } }`.\nThe existing test `e2e/pages/tunocent/index.test.ts` (\"should show initial windows\") only asserts a\ndiv with text `/^Welcome to TUNOCENT$/` is visible (title level). This plan goes beyond it: (1)\nverify the text content inside the Welcome window is actually displayed (loading indicator gone,\n`.prose` content rendered), and (2) assert on specific phrases of the rendered text to prove the\nCORRECT text (textId `tunocentOpeningPage`) was loaded — not a wrong/placeholder text.\n\nHow Text windows render (verified): `window-content.vue` routes targetType Text to\n`text-window-content.vue`, which fetches via `useTextById` (GET\n`{apiBase}/vicav/text?id=tunocentOpeningPage`, Accept: application/xml, retry:false) and renders the\nreturned HTML string into `<div v-if=\"data\" class=\"prose max-w-3xl p-8\" v-html=\"data\">`. While\n`isPending||isPlaceholderData` the wrapper div gets `opacity-50 grayscale` and a centered\nLoadingIndicator (svg with `<title>Loading...</title>`, `app/components/ui/loading-indicator.vue`)\nis shown. Winbox 0.2.82 DOM: each window is a `.winbox` inside `#window-root` (id constant\n`windowRootId`, `app/utils/constants.ts`), title in `.wb-title`, content teleported into `.wb-body`,\nclose button `.wb-close`. On first load the LAST restored window holds focus, so scope to the window\nby its `.wb-title` text — do NOT use `.winbox.focus` (here the panel has exactly one window, but\ntitle scoping is the suite convention).\n\nVerified live backend content (curl, 2026-09-02, `/vicav/text?id=tunocentOpeningPage`):\n`<h2>The TUNOCENT project</h2>` followed by 8 paragraphs, each with a bold lead (\"**About**\",\n\"**71 Profiles**\", \"**195 Feature lists**\", \"**185 Sample texts**\", \"**24 Corpus texts**\",\n\"**Browse data** (with 2683 entries)\", \"**Research**\") and a stable descriptive tail after the\nellipsis. The numbers (71/195/185/24/2683) are live data counts and DRIFT over time — they are\nintentionally NOT asserted; only the stable descriptive phrases are.\n\nNegative control (verified 2026-09-02): the \"About\" menu item (About > About, targetType Text,\ntextId `tunocent_about`) renders a DIFFERENT text whose h2 is \"TUNOCENT\" and which contains\n\"(April 2019 → September 2024)\" / \"funded by The Austrian Science Fund (FWF)\". None of the\n`tunocentOpeningPage` phrases asserted below (\"The TUNOCENT project\", \"learn about the\nTUNOCENT-project\", \"a questionnaire that focuses on grammatical and lexical variation\",\n\"transcribed narratives, ethnographic texts and conversations\") appear in `tunocent_about`.\nTunocent main menu items (live project config): About, Profiles, Feature Lists, Sample Texts, Corpus\nTexts, Browse data, Research. About dropdown items: \"About\", \"Team\", \"News\".\n\nSuite conventions (docs/tests.md + specs/text-window-display-test-plan.md): every test first\n`await expect(page.locator(\"#window-root\")).toBeInViewport({ timeout: 30000 })` (hydration gate —\nclicks before hydration are silently dropped). Content assertions are scoped to the specific\nwindow's `.prose`, never page-wide `getByText` (locator name collisions with map layer buttons /\nmenu items). NavigationMenu: wait for `[data-slot=navigation-menu-content]` visible after trigger\nclick (hover-debounce swallows the click); close with Escape. Playwright normalizes whitespace, so\nphrases match even though the backend HTML contains source line breaks. Tests run against the LIVE\nbackend — content assertions can break when backend content changes, not frontend code.\n\nTest file: `e2e/pages/tunocent/text-window-display.test.ts` (new file, header comment\n`// spec: specs/tunocent-text-window-display-test-plan.md`). Run: `pnpm run build` then\n`pnpm run test:e2e text-window-display`.\n\n## Test Scenarios\n\n### 1. First-load Welcome window rendering\n\n**Seed:** `e2e/seed.spec.ts`\n\n#### 1.1. First-load Welcome window renders the tunocentOpeningPage text\n\n**File:** `e2e/pages/tunocent/text-window-display.test.ts`\n\n**Steps:**\n\n1. Purpose: on first load of \"/\", the restored Welcome Text window (the ONLY default panel window\n   for TUNOCENT) must render its text content, must not remain stuck on the loading indicator, and\n   the rendered content must provably be textId `tunocentOpeningPage`. Preconditions: `.env.local`\n   sets `NUXT_PUBLIC_API_BASE_URL=\"https://tunocent-api.acdh-dev.oeaw.ac.at\"`; app built\n   (`pnpm run build`); tests run via `pnpm run test:e2e` against the webServer on\n   http://localhost:3000.\n2. Navigate: `await page.goto(\"/\")`\n\n   - expect: Page loads (document title \"Home | TUNOCENT - Tunisia's Linguistic terra incognita…\")\n\n3. Hydration gate (mandatory suite convention — clicks before hydration are silently dropped):\n   `await expect(page.locator(\"#window-root\")).toBeInViewport({ timeout: 30000 })`\n\n   - expect: App hydrated and the default panel window (Welcome to TUNOCENT) restored\n\n4. Locate the Welcome window by title (NOT `.winbox.focus` — on first load the last restored window\n   holds focus): `const welcome = page.locator(\".winbox\", { has: page.locator(\".wb-title\", {\n   hasText: /^Welcome to TUNOCENT$/ }) })`\n\n   - expect: Exactly one `.winbox` matches (the TUNOCENT panel contains exactly one window) and it\n     is visible: `expect(welcome).toHaveCount(1)`; `await expect(welcome).toBeVisible()`\n\n5. `await expect(welcome.locator(\".prose\")).toBeVisible({ timeout: 15000 })`\n\n   - expect: The content container `div.prose` (`v-if=\"data\"`) is rendered once\n     `GET /vicav/text?id=tunocentOpeningPage` resolves — the text is displayed, not an empty or\n     spinner-only window\n\n6. `await expect(welcome.locator(\"svg\").filter({ has: page.locator(\"title\", { hasText: /Loading/ })\n   })).not.toBeVisible()`\n\n   - expect: The centered LoadingIndicator (svg with `<title>Loading...</title>`) is gone —\n     `isPending`/`isPlaceholderData` are both false\n\n7. Optional: `await expect(welcome.locator(\".wb-body > div\")).not.toHaveClass(/opacity-50/)`\n\n   - expect: The loading dim classes (`opacity-50 grayscale`) are removed from the content wrapper\n     div once data loaded\n\n8. Heading assertion: `await expect(welcome.locator(\".prose h2\", { hasText: /^The TUNOCENT\n   project$/ })).toBeVisible()`\n\n   - expect: The `tunocentOpeningPage` document heading `<h2>The TUNOCENT project</h2>` is present\n     — this heading is unique to this text\n\n9. Stable body phrase 1 (About paragraph): `await expect(welcome.locator(\".prose\").getByText(\"learn\n   about the TUNOCENT-project, its team members and activities\")).toBeVisible()`\n\n   - expect: The stable tail of the \"About\" paragraph is present\n\n10. Stable body phrase 2 (Feature lists paragraph): `await expect(welcome.locator(\".prose\")\n    .getByText(\"a questionnaire that focuses on grammatical and lexical variation\")).toBeVisible()`\n\n    - expect: The stable tail of the \"Feature lists\" paragraph is present\n\n11. Stable body phrase 3 (Corpus texts paragraph): `await expect(welcome.locator(\".prose\")\n    .getByText(\"transcribed narratives, ethnographic texts and conversations\")).toBeVisible()`\n\n    - expect: The stable tail of the \"Corpus texts\" paragraph is present\n\n12. Notes: all content assertions are scoped to the Welcome window's `.prose` — never page-wide\n    `getByText` (locator name collisions with menu items and map layer buttons). Phrases are\n    contiguous within a single paragraph and Playwright normalizes whitespace (backend HTML\n    contains source line breaks). The data counts (71/195/185/24/2683) are VOLATILE and\n    intentionally NOT asserted. These are live-backend CONTENT assertions: stable project\n    documentation, but they break if the backend rewrites the opening page (content change, not\n    frontend bug).\n\n13. Failure conditions: `.prose` never visible within 15s, or LoadingIndicator still visible after\n    data should have arrived, or any phrase missing.\n\n    - expect: Test fails if `.prose` never appears (text fetch failed — `useTextById` has\n      retry:false, a failed request leaves the window empty with the spinner), if the indicator\n      persists (query stuck pending/placeholder), or if a phrase is absent (wrong textId loaded, or\n      backend content change — triage per §7)\n\n### 2. Assertion specificity (negative control)\n\n**Seed:** `e2e/seed.spec.ts`\n\n#### 2.1. About window does not contain the welcome phrases\n\n**File:** `e2e/pages/tunocent/text-window-display.test.ts`\n\n**Steps:**\n\n1. Purpose: prove the content assertions of test 1.1 are specific enough to catch a WRONG textId —\n   a window loading a different text must not contain the welcome phrases. Uses About > About\n   (targetType Text, textId `tunocent_about`), verified 2026-09-02 to contain none of the\n   `tunocentOpeningPage` phrases (its h2 is \"TUNOCENT\"; it contains \"(April 2019 → September 2024)\"\n   and \"funded by The Austrian Science Fund (FWF)\" instead).\n2. Navigate to \"/\" and pass the hydration gate: `await\n   expect(page.locator(\"#window-root\")).toBeInViewport({ timeout: 30000 })`\n\n   - expect: Default Welcome window restored\n\n3. Open the About menu: `await page.locator(\"[data-slot=navigation-menu-list]\").getByRole(\"button\",\n   { name: \"About\", exact: true }).click(); await expect(page.locator(\"[data-slot=navigation-menu-content]\")).toBeVisible()`\n\n   - expect: The About dropdown opens (NavigationMenu hover-debounce: wait for the content element\n     — do not assume the click toggled it; an open menu cannot be closed by clicking its trigger)\n\n4. `await page.locator(\"[data-slot=navigation-menu-content]\").getByRole(\"button\", { name: \"About\",\n   exact: true }).click()`\n\n   - expect: An About window opens (targetType Text, textId `tunocent_about`). `exact: true`\n     matters — the dropdown items are \"About\", \"Team\", \"News\"\n\n5. Locate the About window: `const about = page.locator(\".winbox\", { has: page.locator(\".wb-title\",\n   { hasText: /^About$/ }) })`; `await expect(about.locator(\".prose\")).toBeVisible({ timeout: 15000 })`\n\n   - expect: The About text rendered (window not empty). ASSUMPTION: the window title equals the\n     menu item name (\"About\"), per suite convention (cf. vicav \"Contributors\"). Fallback if the\n     live title differs: scope by content — `page.locator(\".winbox\", { has: page.locator(\".prose\n     h2\", { hasText: /^TUNOCENT$/ }) })` (the Welcome window's h2 \"The TUNOCENT project\" does not\n     exact-match, so the fallback is unambiguous)\n\n6. Positive control — the window shows its OWN heading: `await expect(about.locator(\".prose h2\", {\n   hasText: /^TUNOCENT$/ })).toBeVisible()`\n\n   - expect: A different text was loaded (h2 \"TUNOCENT\", not \"The TUNOCENT project\")\n\n7. `await expect(about.locator(\".prose h2\", { hasText: /^The TUNOCENT project$/ })).toHaveCount(0)`\n\n   - expect: The welcome heading is ABSENT from the About window\n\n8. `await expect(about.locator(\".prose\").getByText(\"learn about the TUNOCENT-project\")).toHaveCount(0)`\n\n   - expect: Welcome phrase 1 is ABSENT from the About window\n\n9. `await expect(about.locator(\".prose\").getByText(\"a questionnaire that focuses on grammatical and\n   lexical variation\")).toHaveCount(0)`\n\n   - expect: Welcome phrase 2 is ABSENT from the About window\n\n10. `await expect(about.locator(\".prose\").getByText(\"transcribed narratives, ethnographic texts and\n    conversations\")).toHaveCount(0)`\n\n    - expect: Welcome phrase 3 is ABSENT from the About window\n\n11. Optional positive control: `await expect(about.locator(\".prose\").getByText(\"funded by The\n    Austrian Science Fund (FWF)\")).toBeVisible()`\n\n    - expect: A phrase unique to `tunocent_about` is present — the window really loaded the About\n      text (not an empty/error window, which would vacuously pass the absence assertions)\n\n12. Close the dropdown with `await page.keyboard.press(\"Escape\")` if still open (an open\n    NavigationMenu cannot be closed by clicking its trigger)\n\n---\n\n## 4. Selector Reference\n\n| Target                             | Suggested selector                                                                                                                                    |\n| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |\n| Hydration gate (every test, first) | `page.locator(\"#window-root\")` — `toBeInViewport({ timeout: 30000 })`                                                                                 |\n| Welcome window                     | `page.locator(\".winbox\", { has: page.locator(\".wb-title\", { hasText: /^Welcome to TUNOCENT$/ }) })`                                                  |\n| About window                       | `page.locator(\".winbox\", { has: page.locator(\".wb-title\", { hasText: /^About$/ }) })` (assumption; fallback: scope by `.prose h2` `/^TUNOCENT$/`)   |\n| Text content container             | `<winbox>.locator(\".prose\")` (only in DOM once data loaded, `v-if=\"data\"`)                                                                            |\n| Loading indicator                  | `<winbox>.locator(\"svg\").filter({ has: page.locator(\"title\", { hasText: /Loading/ }) })` (LoadingIndicator renders `<title>Loading...</title>`)       |\n| Loading dim classes                | `<winbox>.locator(\".wb-body > div\")` — must NOT match `/opacity-50/` (component adds `opacity-50 grayscale` while `isPending \\|\\| isPlaceholderData`) |\n| Welcome heading                    | `<welcome>.locator(\".prose h2\", { hasText: /^The TUNOCENT project$/ })`                                                                               |\n| About heading                      | `<about>.locator(\".prose h2\", { hasText: /^TUNOCENT$/ })`                                                                                             |\n| About menu trigger                 | `page.locator(\"[data-slot=navigation-menu-list]\").getByRole(\"button\", { name: \"About\", exact: true })`                                               |\n| Open menu content                  | `page.locator(\"[data-slot=navigation-menu-content]\")` (wait for visible after trigger click)                                                          |\n| About menu item                    | `page.locator(\"[data-slot=navigation-menu-content]\").getByRole(\"button\", { name: \"About\", exact: true })` (items: About, Team, News)                 |\n| Window close button                | `<winbox>.locator(\".wb-close\")` (scoped per window, not `.first()` page-wide)                                                                         |\n\nNotes:\n\n- Scope every content assertion to the specific window's `.prose` — never page-wide `getByText`\n  (locator name collisions: menu items and map layer buttons can contain colliding strings; see\n  \"Locator name collisions\" in docs/tests.md).\n- Do NOT scope to `.winbox.focus` on first load: Winbox moves focus into the last restored window.\n  (`.winbox.focus .wb-title` is only valid after explicitly focusing a window, e.g. via the Windows\n  dropdown.)\n- Windows may overlap on small viewports; Playwright visibility is CSS-based (not occlusion), so\n  DOM-scoped assertions are unaffected.\n- Playwright normalizes whitespace, so phrases match even though the backend HTML contains source\n  line breaks.\n- NavigationMenu trigger clicks are swallowed by design (hover debounce); always wait for\n  `[data-slot=navigation-menu-content]` visible, and close with Escape.\n\n---\n\n## 5. Test Execution Matrix\n\n| Test ID       | Test case                                              | Suite | Priority | Fragility                                                                                          |\n| ------------- | ------------------------------------------------------ | ----- | -------- | -------------------------------------------------------------------------------------------------- |\n| TUNO-TEXT-001 | First-load Welcome window renders tunocentOpeningPage  | 1.1   | Critical | Content (stable opening-page phrases); structural parts (`.prose`, indicator) are stable           |\n| TUNO-TEXT-002 | About window does not contain the welcome phrases      | 2.1   | High     | Content (absence assertions); About window title is an assumption (fallback locator provided)      |\n\nBrowsers: chromium, firefox, webkit (all three desktop projects in playwright.config.ts). Viewport:\ndefault desktop (1280x720).\n\n---\n\n## 6. Running the Tests\n\n```bash\n# .env.local (gitignored) — required, dotenv -e wrapper fails without it\nNUXT_PUBLIC_API_BASE_URL=\"https://tunocent-api.acdh-dev.oeaw.ac.at\"\n\npnpm run build          # PUBLIC vars are read at server start; rebuild only if code changed\npnpm run test:e2e       # all tunocent tests (webServer: pnpm run start:local on :3000)\npnpm run test:e2e text-window-display   # only this plan's tests\n```\n\n- Kill any stale server on port 3000 before switching backends\n  (`webServer.reuseExistingServer: true` locally).\n- CI: 1 worker, 2 retries, `forbidOnly` on.\n- Test file header convention: `// spec: specs/tunocent-text-window-display-test-plan.md`.\n\n---\n\n## 7. Live-Backend Fragility (stable vs volatile)\n\nTests hit the real backend, so they can break when backend **content** changes rather than frontend\ncode (docs/tests.md).\n\n| Assertion                                                                              | Stability                                                 | Breaks when                                                                    |\n| -------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |\n| Window title \"Welcome to TUNOCENT\"                                                     | Stable                                                    | Project config changes panel windows                                           |\n| `.prose` rendered, LoadingIndicator gone (TUNO-TEXT-001)                               | Stable (structural)                                       | Frontend regression or text fetch failure (retry:false → empty window + spinner) |\n| Data counts 71 / 195 / 185 / 24 / 2683                                                 | **Volatile** — live data counts drift                     | Any data update → therefore intentionally NOT asserted                          |\n| Welcome h2 \"The TUNOCENT project\"                                                      | Stable (project documentation)                            | Backend rewrites the opening page                                              |\n| Welcome phrases \"learn about the TUNOCENT-project…\", \"a questionnaire that focuses…\", \"transcribed narratives…\" | Stable (core descriptive copy)          | Backend rewrites the opening page                                              |\n| About window title \"About\"                                                             | Assumed (equals menu item name)                           | Backend sets a different window title → use the fallback locator (§4)          |\n| About h2 \"TUNOCENT\" (TUNO-TEXT-002)                                                    | Stable                                                    | Backend rewrites the About text                                                |\n| TUNO-TEXT-002 absence assertions                                                       | Stable while `tunocent_about` keeps its current wording   | About text gains the welcome phrases (unlikely)                                |\n\n**Triage rule:** if a content assertion fails, first re-verify the live content before assuming a\nfrontend bug:\n\n```bash\ncurl -s -H \"Accept: application/xml\" \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocentOpeningPage\"\ncurl -s -H \"Accept: application/xml\" \"https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocent_about\"\n```\n\nIf the phrases are still in the response, the failure is a frontend regression\n(fetch/render/loading-state); if they are gone, update the spec's phrases to the new stable wording\n(never assert on the drifting data counts).\n\n---\n\n## 8. Success Criteria\n\n- On first load of `/`, the restored Welcome window (the only default panel window for TUNOCENT)\n  displays its text content: `.prose` rendered, LoadingIndicator gone, no `opacity-50` dimming.\n- The Welcome window's rendered content provably belongs to textId `tunocentOpeningPage` (unique\n  heading \"The TUNOCENT project\" + three stable body phrases), without coupling the test to the\n  volatile data counts.\n- The About window (different textId `tunocent_about`, opened via About > About) provably does NOT\n  contain the welcome phrases and shows its own h2 \"TUNOCENT\" — the assertions are specific to\n  `tunocentOpeningPage`, so a wrong/placeholder textId would fail the test.\n"
}
````

**Output:**

```
Wrote file successfully.
```

---

## Assistant (Build · Qwen3.8 27B Q4_0 · 94.4s)

_Thinking:_

The spec document has been written. Next, let's check whether the formatting passes (the repository
has a format:check, probably prettier). Let's run format check on that file. AGENTS.md says
`pnpm run validate` runs format, lint, typecheck, and unit tests. For a markdown file, it's probably
prettier. Let's check if prettier is configured and try running format:check on that file.

Spec document written. Let me verify it passes the repo's format check.

**Tool: bash**

**Input:**

```json
{
	"command": "pnpm exec prettier --check specs/tunocent-text-window-display-test-plan.md 2>&1 || pnpm run format:check 2>&1 | tail -20",
	"timeout": 180000
}
```

**Output:**

```
Checking formatting...
[[33mwarn[39m] specs/tunocent-text-window-display-test-plan.md
[[33mwarn[39m] Code style issues found in the above file. Run Prettier with --write to fix.

> @acdh-oeaw/vicav-frontend@0.8.0 format:check V:\vicav-vue3
> prettier . --cache --check --ignore-path ./.gitignore --ignore-path ./.prettierignore

Checking formatting...
[[33mwarn[39m] specs/tunocent-text-window-display-test-plan.md
[[33mwarn[39m] Code style issues found in the above file. Run Prettier with --write to fix.
 ELIFECYCLE  Command failed with exit code 1.

```

---

## Assistant (Build · Qwen3.8 27B Q4_0 · 12.5s)

_Thinking:_

Prettier is demanding a different format (probably line wrapping). Let's run prettier --write on
that file.

**Tool: bash**

**Input:**

```json
{
	"command": "pnpm exec prettier --write specs/tunocent-text-window-display-test-plan.md && pnpm exec prettier --check specs/tunocent-text-window-display-test-plan.md",
	"timeout": 120000
}
```

**Output:**

```
specs/tunocent-text-window-display-test-plan.md 91ms
Checking formatting...
All matched files use Prettier code style!

```

---

## Assistant (Build · Qwen3.8 27B Q4_0 · 24.4s)

_Thinking:_

Prettier reformatted the file (probably wrapped long lines). Format check passed. Done — the spec
document has been written and is in a clean state format-wise.

Summary for the user: I wrote specs/tunocent-text-window-display-test-plan.md. It contains 2 test
scenarios (the main initial-load test + the negative control), a selector reference, an execution
matrix, execution instructions, a fragility table, and success criteria. The phrases were verified
against the live tunocent backend.

Done. `specs/tunocent-text-window-display-test-plan.md` is written and passes the Prettier format
check.

**What the plan covers:**

- **TUNO-TEXT-001 (primary):** first load of `/` restores the single default panel window "Welcome
  to TUNOCENT" (`textId: tunocentOpeningPage`); asserts `.prose` renders, LoadingIndicator is gone,
  and the content is provably the right text via h2 "The TUNOCENT project" + 3 stable body phrases
  (verified live today): "learn about the TUNOCENT-project, its team members and activities", "a
  questionnaire that focuses on grammatical and lexical variation", "transcribed narratives,
  ethnographic texts and conversations"
- **TUNO-TEXT-002 (negative control):** the About window (`tunocent_about`) contains none of those
  phrases and shows its own h2 "TUNOCENT" — proving the assertions are specific
- Volatile data counts (71/195/185/24/2683) are intentionally not asserted; fragility table + curl
  triage rule included

Per your choice, no test file was created — say the word if you want
`e2e/pages/tunocent/text-window-display.test.ts` implemented and run next.

---
