# TUNOCENT Initial Text Window Display Test Plan

This plan was generated with the `@playwright-test-planner` agent using the prompt:

> Read the contents of `docs/` and `specs/` directories to get information about the code. Use
> @playwright-test-planner to plan a test. I need one test that verifies that the initial text is
> loaded on a tunocent instance of this web site in a window. Find a few lines or phrases that
> ensure it is the correct text.

## Overview

This plan defines **one** Playwright E2E test that verifies the initial **"Welcome to TUNOCENT"**
Text window on the **TUNOCENT** instance of the VICAV web app (Vue 3/Nuxt + Winbox window UI).

**Application URL**: `http://localhost:3000` (Playwright `webServer` via `pnpm run start:local`)
**Backend API**: `https://tunocent-api.acdh.oeaw.ac.at` (set in `.env.local:25`) **Initial window**:
id `tunocentWelcome`, title `Welcome to TUNOCENT`, `targetType: Text`,
`params.textId: tunocentOpeningPage` **Endpoint exercised**:
`GET {NUXT_PUBLIC_API_BASE_URL}/vicav/text?id=tunocentOpeningPage`

It asserts two distinct things, in order:

1. **Loading resolved** — the window's text content (`.prose`) is actually rendered in the DOM and
   the `LoadingIndicator` is gone. This proves the `useTextById()` fetch completed successfully (a
   failed fetch leaves `.prose` absent because it is gated on `v-if="data"`; the composable has
   `retry: false`, so a failure is silent).
2. **Correct text** — the rendered content contains a small set of **unique, stable** phrases that
   only the opening text (`textId: tunocentOpeningPage`) contains. This proves the _right_ text was
   loaded, not just _some_ text (e.g. the About window, whose `<h2>` is only `"TUNOCENT"` and does
   **not** contain `"The TUNOCENT project"`).

## How the Text window renders (verified in source)

- `app/components/window-content.vue:27` routes `targetType === "Text"` → `text-window-content.vue`.
- `app/components/text-window-content.vue`:
  - `:15` `const { data, isPending, isPlaceholderData } = useTextById(queryParams)`
  - `:18-20` `isLoading = isPending || isPlaceholderData`
  - `:24-27` wrapper
    `<div class="relative isolate grid size-full overflow-auto" :class="{ 'opacity-50 grayscale': isLoading }">`
  - `:32` content: `<div v-if="data" class="prose max-w-3xl p-8" v-html="data" />` (only in DOM once
    data resolved)
  - `:34-36` `<Centered v-if="isLoading"><LoadingIndicator /></Centered>`
- `app/composables/use-text-by-id.ts:6-23`: `useQuery` with `retry: false`;
  `api.vicav.getText({ id: params.textId }, { headers: { accept: "application/xml" } })`; returns
  `response.text()`.
- `app/components/ui/loading-indicator.vue:9`: the "Loading..." text lives in
  `<svg><title>Loading...</title></svg>`.
- Window chrome (Winbox): each window is a `.winbox` inside `#window-root`; title is in `.wb-title`;
  content teleports into `.wb-body`. On first load the LAST restored window holds focus → scope to
  the window by its `.wb-title` text, **do not** rely on `.winbox.focus`.

## Live content of `tunocentOpeningPage` (verified via curl, 2026-09-03)

This is the real HTML rendered into `.prose`:

```
<div xmlns="http://www.w3.org/1999/xhtml">
  <h2>The TUNOCENT project</h2>
  <p><b>About</b> … team members, news section: learn about the TUNOCENT-project, its team members and activities</p>
  <p> <b>71 Profiles </b>… geography, history and most notable sights of the research locations; ...
  <p><b>195 Feature lists </b>… a questionnaire that focuses on grammatical and lexical variation: ...
  <p><b>185 Sample texts </b> … a text with seven sentences which provide details on everyday activities and duties: ...
  <p><b>24 Corpus texts</b> … transcribed narratives, ethnographic texts and conversations: read the texts and search for words within the corpus texts; listen to selected texts </p>
  <p><b>Browse data </b>(with 2683 entries) … data list with speakers and the details of locations and data type: ...
  <p><b>Research</b> … lists with publications, presentations and the conference we organised; ...
</div>
```

### Phrases that ensure it is the correct text

| Phrase                                                                           | Why it's a reliable discriminator                                                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `The TUNOCENT project` (the `<h2>`)                                              | **Unique** — the About text's heading is just `TUNOCENT`; only the opening page has "The TUNOCENT project". The strongest single assertion. |
| `learn about the TUNOCENT-project, its team members and activities`              | Unique to the opening page (About/Team/News don't contain it).                                                                              |
| `transcribed narratives, ethnographic texts and conversations`                   | Unique to the opening page's Corpus-texts line.                                                                                             |
| _(optional, semi-volatile)_ `71 Profiles` / `195 Feature lists` / `2683 entries` | Mirror live data counts — can drift; secondary only, not the core guarantee.                                                                |

## Pre-conditions / Assumptions

- **Fresh state:** the test starts from a clean browser context; the only initial window present is
  `tunocentWelcome`. (Do **not** rely on `.winbox.focus` — on first load focus goes to the last
  restored window; scope by title instead.)
- **Backend is online** and serving TUNOCENT. Tests hit the **live** backend, so content assertions
  can break when backend _content_ (not frontend code) changes.
- **Environment is already correct:** `.env.local:25` →
  `NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh.oeaw.ac.at"`. The npm scripts inject it via
  `dotenv -e`; no manual env var is needed. `playwright.config.ts` maps this URL to backend
  `tunocent` and sets `testMatch: "tunocent/**/*.@(test|spec).ts"`.
- **Timeouts:** the Playwright config does not override `expect.timeout`, so the default is **5s**.
  The `.prose` assertion explicitly passes `{ timeout: 15000 }`; the hydration gate passes
  `{ timeout: 30000 }`.
- **Existing related test** `e2e/pages/tunocent/index.test.ts:11-19` ("should show initial windows")
  only asserts a `div` filtered by `/^Welcome to TUNOCENT$/` `.nth(1)` is visible — title-level
  only. This plan goes beyond it: it verifies the `.prose` content is rendered and the correct
  textId's phrases are present.

## Test Scenarios

### 1. First-load Text window rendering

#### 1.1. Initial "Welcome to TUNOCENT" window loads the correct text

**File:** `e2e/pages/tunocent/text-window-display.test.ts`

**Steps:**

| #   | Step                                                                                                              | Action                                                                                                                                          | `expect`                   |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | Navigate to home                                                                                                  | `await page.goto("/")`                                                                                                                          | —                          |
| 2   | **Hydration gate** (suite convention; interactions before this are silently dropped)                              | `await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 })`                                                                 | `#window-root` in viewport |
| 3   | Locate the initial window **by its title bar** (not by `.winbox.focus`)                                           | `const winbox = page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^Welcome to TUNOCENT$/ }) })`                              | —                          |
| 4   | Window present & visible                                                                                          | `await expect(winbox).toBeVisible()`                                                                                                            | window visible             |
| 5   | Text content rendered — the "loading resolved" proof (`.prose` only enters the DOM once `useTextById()` resolves) | `const prose = winbox.locator(".prose"); await expect(prose).toBeVisible({ timeout: 15000 })`                                                   | `.prose` visible           |
| 6   | `LoadingIndicator` gone                                                                                           | `const spinner = winbox.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ }) }); await expect(spinner).not.toBeVisible()` | spinner **not** visible    |
| 7   | Unique heading (proves it's the opening page, not the About window whose `<h2>` is only `"TUNOCENT"`)             | `await expect(prose.getByText("The TUNOCENT project")).toBeVisible()`                                                                           | heading visible            |
| 8   | Unique stable body phrase (About section)                                                                         | `await expect(prose.getByText("learn about the TUNOCENT-project, its team members and activities")).toBeVisible()`                              | phrase visible             |
| 9   | Second unique stable body phrase (Corpus texts section)                                                           | `await expect(prose.getByText("transcribed narratives, ethnographic texts and conversations")).toBeVisible()`                                   | phrase visible             |
| 10  | _(Optional — semi-volatile counts; not part of the core guarantee)_                                               | e.g. `await expect(prose.getByText(/71\s+Profiles/)).toBeVisible()`                                                                             | count visible              |

**Failure conditions:**

- `.prose` never appears (step 5 times out) → the text fetch failed (`retry: false`), leaving an
  empty window. This is the primary failure this test is designed to catch.
- Spinner still visible after `.prose` is visible (step 6) → anomalous state where both `data` and
  `isLoading` are truthy (state-management/hydration bug).
- Heading/phrase not found (steps 7–9) → the window renders a _different_ `textId`, or the backend
  content was edited (triage with the curl commands below).
- `#window-root` never in viewport (step 2 times out) → hydration/window-restore failure (broader
  than this window).

## Reference Implementation

`e2e/pages/tunocent/text-window-display.test.ts`

```ts
// spec: specs/text-window-display-test-plan.md
import { expect, test } from "@playwright/test";

test.describe("TUNOCENT initial Text window", () => {
	test("loads the correct initial text (tunocentOpeningPage)", async ({ page }) => {
		await page.goto("/");
		// Hydration gate — interactions before this are silently dropped (docs/tests.md).
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Scope to the window by its title bar (do NOT use .winbox.focus).
		const winbox = page.locator(".winbox", {
			has: page.locator(".wb-title", { hasText: /^Welcome to TUNOCENT$/ }),
		});
		await expect(winbox).toBeVisible();

		// .prose only enters the DOM once useTextById() resolves (v-if="data").
		const prose = winbox.locator(".prose");
		await expect(prose).toBeVisible({ timeout: 15000 });

		// LoadingIndicator is <svg><title>Loading...</title></svg>. `has` lives in .filter(),
		// not in locator() options.
		const spinner = winbox
			.locator("svg")
			.filter({ has: page.locator("title", { hasText: /Loading/ }) });
		await expect(spinner).not.toBeVisible();

		// Unique, stable phrases proving this is textId tunocentOpeningPage, not another text.
		await expect(prose.getByText("The TUNOCENT project")).toBeVisible();
		await expect(
			prose.getByText("learn about the TUNOCENT-project, its team members and activities"),
		).toBeVisible();
		await expect(
			prose.getByText("transcribed narratives, ethnographic texts and conversations"),
		).toBeVisible();

		// (OPTIONAL — semi-volatile) Live data counts; can drift, secondary signal only.
		// await expect(prose.getByText(/71\s+Profiles/)).toBeVisible();
		// await expect(prose.getByText(/195\s+Feature lists/)).toBeVisible();
		// await expect(prose.getByText(/2683\s+entries/)).toBeVisible();
	});
});
```

> **Locator-robustness note:** each `getByText(...)` above is scoped to the single `.prose` element
> and, for these phrases, resolves to exactly one element, so `toBeVisible()` is safe. If a
> strict-mode (multiple-elements) violation is ever observed after a backend content change, use the
> bulletproof equivalent `await expect(prose).toContainText("<phrase>")`, which asserts against the
> single `.prose` container and has no multi-match risk.

## Selector Reference

| Target                 | Suggested selector                                                                                  | Notes                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Hydration gate (first) | `page.locator("#window-root")` — `toBeInViewport({ timeout: 30000 })`                               | established suite convention                                            |
| Initial window         | `page.locator(".winbox", { has: page.locator(".wb-title", { hasText: /^Welcome to TUNOCENT$/ }) })` | scope by title-bar text; **not** `.winbox.focus`                        |
| Text content           | `<winbox>.locator(".prose")`                                                                        | rendered only once `useTextById()` resolves (`v-if="data"`)             |
| Loading indicator      | `<winbox>.locator("svg").filter({ has: page.locator("title", { hasText: /Loading/ }) })`            | the `<svg><title>Loading...</title></svg>`; assert `.not.toBeVisible()` |
| Heading (unique)       | `<prose>.getByText("The TUNOCENT project")`                                                         | unique to `tunocentOpeningPage`                                         |
| Body phrase 1 (unique) | `<prose>.getByText("learn about the TUNOCENT-project, its team members and activities")`            | unique to the opening page                                              |
| Body phrase 2 (unique) | `<prose>.getByText("transcribed narratives, ethnographic texts and conversations")`                 | unique to the opening page                                              |
| (optional) counts      | `<prose>.getByText(/71\s+Profiles/)` etc.                                                           | semi-volatile; secondary only                                           |

Notes:

- Scope every content assertion to the specific window's `.prose` — never page-wide `getByText`
  (locator name collisions with the map window's layer buttons and menu items; see "Locator name
  collisions" in docs/tests.md).
- Do NOT scope to `.winbox.focus` on first load: Winbox moves focus into the last restored window.
- Windows may overlap; Playwright visibility is CSS-based (not occlusion), so DOM-scoped assertions
  are unaffected.
- Playwright normalizes whitespace, so phrases match even though the backend HTML contains source
  line breaks.

## Test Execution Matrix

| Test ID | Test case                                                   | Suite | Priority | Fragility                                                         |
| ------- | ----------------------------------------------------------- | ----- | -------- | ----------------------------------------------------------------- |
| TW-001  | Initial "Welcome to TUNOCENT" window loads the correct text | 1.1   | Critical | Content (unique, stable phrases) + structural (`.prose`, spinner) |

Browsers: `chromium`, `firefox`, `webkit` (all three desktop projects in `playwright.config.ts`).
Viewport: default desktop. This single test runs once per browser (3 runs).

## Running the Tests

The npm scripts inject `.env.local` (which already targets TUNOCENT) into both the app and the
Playwright runner via `dotenv -e`, so no manual env var is required. `PUBLIC_*` vars are read at
server start (Nitro re-applies `NUXT_*` on startup), so the backend is correct without a rebuild —
but run a clean build anyway for a deterministic production bundle.

```bash
# From repo root

# 1. Build the production server
pnpm run build

# 2. Run just this test (name filter matches the file)
pnpm run test:e2e text-window-display

# 3. Or run the whole TUNOCENT suite
pnpm run test:e2e
```

- **Local behavior:** `retries: 0`, `forbidOnly: off`, `webServer.reuseExistingServer: true`.
- **Port 3000 caveat:** because `reuseExistingServer` is `true` locally, if a server from a
  _different_ backend is already listening on port 3000, Playwright reuses it as-is. Kill any
  process on port 3000 before switching backends. (Not an issue here — `.env.local` already targets
  TUNOCENT.)
- **CI:** 1 worker, 2 retries, `forbidOnly` on.
- **VS Code extension:** bypasses the npm scripts, so set `NUXT_PUBLIC_API_BASE_URL` via
  `playwright.env` in your VS Code settings, otherwise the config throws `Unknown backend …`.

## Live-Backend Fragility (stable vs volatile)

E2E tests hit the **live** TUNOCENT backend. Content assertions can break when the **backend
content** changes — not when frontend code changes. Triage accordingly.

| Assertion                                                                 | Volatility       | If it fails, first suspect                                                                                            |
| ------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `.prose` visible (step 5)                                                 | Low (structural) | Text fetch failed (network / endpoint / `textId` renamed) or SSR/hydration regression. **Most likely a real defect.** |
| Spinner not visible (step 6)                                              | Low (structural) | Same as above; or `isLoading` stuck while data resolved                                                               |
| `"The TUNOCENT project"` heading (step 7)                                 | Medium           | Backend edited the opening text's heading, or the initial window now points at a different `textId`                   |
| `"learn about the TUNOCENT-project, …"` (step 8)                          | Medium           | Backend edited the About paragraph wording                                                                            |
| `"transcribed narratives, ethnographic texts and conversations"` (step 9) | Medium           | Backend edited the Corpus-texts paragraph wording                                                                     |
| Counts `71 / 195 / 185 / 24 / 2683` (step 10, optional)                   | **High**         | Live data counts drifted. **Expected to change; not a defect.**                                                       |

**Re-verify live content (triage):**

```bash
# Confirm the phrases are still present in the rendered text
curl -s -H "Accept: application/xml" "https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/text?id=tunocentOpeningPage"

# Confirm the initial window still maps to this text
curl -s "https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/project" | grep -o '"tunocentOpeningPage"'
```

If the phrases are still in the response, the failure is a **frontend** regression
(fetch/render/loading-state); if they are gone, it's a **content** change — update the spec's
phrases to the new stable wording rather than treating it as a frontend bug.

## Success Criteria

The test **passes** when, on a fresh load against the TUNOCENT backend, on all three desktop
browsers:

1. `#window-root` is in the viewport (hydrated) within 30s;
2. the window titled `Welcome to TUNOCENT` is visible;
3. its `.prose` content is visible within 15s (loading resolved);
4. the `LoadingIndicator` is **not** visible; and
5. the rendered text contains **all three** unique phrases: `"The TUNOCENT project"`,
   `"learn about the TUNOCENT-project, its team members and activities"`, and
   `"transcribed narratives, ethnographic texts and conversations"`.

The test **fails** if the window is absent, the text never renders (fetch failed / empty), the
spinner persists, or any of the three unique phrases is missing (wrong text or content regression).
