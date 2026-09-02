# **Title:** Plan Playwright Test: Verify Initial Text on Tunocent Instance

**Session ID:** ses_f9c0afc11ffeMTc8jjzIZWrVxC **Created:** 2.9.2026, 23:09:56 **Updated:**
2.9.2026, 23:41:39

---

## User

Read the contents of `docs/` and `specs/` directories to get information about the code. Use
@playwright-test-planner to plan a test. I need one test that verifies that the initial text is
loaded on a tunocent instance of this web site in a window. Find a few lines or phrases that ensure
it is the correct text.

---

## Assistant (Plan · MiniMax-M2.5 · 4.7s)

_Thinking:_

The user wants me to:

1. Read the contents of `docs/` and `specs/` directories to understand the codebase
2. Use @playwright-test-planner to plan a test
3. The test should verify that initial text is loaded on a tunocent instance of the website in a
   window

Let me start by reading the docs and specs directories to understand the codebase, then use the
playwright-test-planner skill.

**Tool: glob**

**Input:**

```json
{
	"pattern": "docs/**/*"
}
```

**Output:**

```
V:\vicav-vue3\docs\menu.md
V:\vicav-vue3\docs\dict-entry-component-mapping.md
V:\vicav-vue3\docs\tei-metadata-loading-caching.md
V:\vicav-vue3\docs\searchbar.md
V:\vicav-vue3\docs\tests.md
V:\vicav-vue3\docs\windowTypes.md
```

**Tool: glob**

**Input:**

```json
{
	"pattern": "specs/**/*"
}
```

**Output:**

```
V:\vicav-vue3\specs\tunocent-menu-test-plan.md
V:\vicav-vue3\specs\text-window-display-test-plan.md
V:\vicav-vue3\specs\shawi-menu-test-plan.md
V:\vicav-vue3\specs\README.md
V:\vicav-vue3\specs\prompt_examples\update-test-plan.md
V:\vicav-vue3\specs\prompt_examples\implement-a-test-plan-section.md
V:\vicav-vue3\specs\prompt_examples\create-test-plan.md
V:\vicav-vue3\specs\menu-test-plan.md
```

---

## Assistant (Plan · MiniMax-M2.5 · 4.1s)

_Thinking:_

Let me read the key files to understand the test requirements, particularly the tunocent test plan
and the text window display test plan.

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

---

## Assistant (Plan · MiniMax-M2.5 · 80.6s)

_Thinking:_

Now I have a good understanding of the codebase. The user wants a test that verifies initial text is
loaded on a TUNOCENT instance, similar to what's done for VICAV in
`specs/text-window-display-test-plan.md`.

Let me analyze:

1. TUNOCENT is a different backend application (https://tunocent-api.acdh-dev.oeaw.ac.at)
2. It uses the same Vue 3/Nuxt framework with Winbox windows
3. The test should verify that when the site first loads, a text window is displayed and contains
   the correct content

I need to use the playwright-test-planner to create a test plan. Let me delegate this task.

**Tool: task**

**Input:**

```json
{
	"description": "Plan TUNOCENT text test",
	"prompt": "Create a test plan for verifying that initial text is loaded on a TUNOCENT instance of the VICAV web application in a window.\n\nUse the information from these files:\n- `specs/tunocent-menu-test-plan.md` - Contains info about TUNOCENT app structure, menu items, and test data\n- `specs/text-window-display-test-plan.md` - Contains a similar test plan for VICAV that shows how to verify text content in windows\n- `docs/tests.md` - Contains testing conventions and backend URLs\n\nThe test should:\n1. Navigate to the TUNOCENT instance (http://127.0.0.1:3000 with NUXT_PUBLIC_API_BASE_URL=\"https://tunocent-api.acdh-dev.oeaw.ac.at\")\n2. On first load, verify that a text window is displayed\n3. Verify that the text content is actually loaded (not stuck on loading indicator)\n4. Find specific phrases in the rendered text to verify it's the correct text\n\nI need to find a few lines or phrases that ensure the correct text is loaded. Look at what text windows are available on TUNOCENT first load (check openapi.json or the menu structure in tunocent-menu-test-plan.md).\n\nThe output should be a detailed test plan that can be implemented in a Playwright test file.\n\nIMPORTANT: Do NOT make any edits - this is just a planning task.",
	"subagent_type": "playwright-test-planner"
}
```

**Output:**

````
<task id="ses_f9bef2ff4ffehhzzb1Fy4c8cIm" state="completed">
<task_result>
The test plan has been created and saved to `specs/tunocent-text-window-display-test-plan.md`. Here's a summary:

## Test Plan Summary

**Purpose:** Verify that initial text is loaded on a TUNOCENT instance of the VICAV web application in a window.

### Key Details:

**Environment:**
- Frontend URL: `http://127.0.0.1:3000`
- Backend API: `https://tunocent-api.acdh-dev.oeaw.ac.at`
- Environment Variable: `NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"`

**Default Window on TUNOCENT First Load:**
- Based on the API response, TUNOCENT displays a "Welcome to TUNOCENT" window (target: `tunocentOpeningPage`)
- This is configured in the `<frontpage>` section of the project config

**Test Cases:**

1. **TC-001: Welcome window shows loaded text content**
   - Verifies the `.prose` content container is rendered
   - Verifies the loading indicator is no longer visible
   - Optionally checks that loading dim classes are removed

2. **TC-002: Welcome window content matches textId tunocentOpeningPage**
   - Verifies the heading: `<h2>The TUNOCENT project</h2>`
   - Verifies specific data phrases:
     - "71 Profiles"
     - "195 Feature lists"
     - "185 Sample texts"
     - "24 Corpus texts"
     - "Browse data"
     - "2683 entries"
     - "Research"

These phrases are verified against the live TUNOCENT API response and are unique to the tunocentOpeningPage text content.

**Test File Location:** `e2e/pages/tunocent/text-window-display.spec.ts`

**Run Command:**
```bash
NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test e2e/pages/tunocent/text-window-display.spec.ts
````

</task_result> </task>

````

---

## Assistant (Plan · MiniMax-M2.5 · 2.9s)

_Thinking:_

The task created a test plan. Let me read it to get the details for the user.

**Tool: read**

**Input:**
```json
{
  "filePath": "V:\\vicav-vue3\\specs\\tunocent-text-window-display-test-plan.md"
}
````

**Output:**

```
<path>V:\vicav-vue3\specs\tunocent-text-window-display-test-plan.md</path>
<type>file</type>
<content>
1: # TUNOCENT First-Load Text Window Display Test Plan
2:
3: ## Application Overview
4:
5: Test plan for verifying that initial text is loaded on a TUNOCENT instance of the VICAV web application. The test navigates to the TUNOCENT backend (http://127.0.0.1:3000 with NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"), verifies that a text window is displayed on first load, confirms the text content is actually loaded (not stuck on loading indicator), and finds specific phrases in the rendered text to verify it's the correct text.
6:
7: ## Test Scenarios
8:
9: ### 1. TUNOCENT Text Window Display
10:
11: **Seed:** `e2e/seed.spec.ts`
12:
13: #### 1.1. TC-001: Welcome window shows loaded text content (loading state resolved)
14:
15: **File:** `e2e/pages/tunocent/text-window-display.spec.ts`
16:
17: **Steps:**
18:   1. Navigate to http://127.0.0.1:3000 with NUXT_PUBLIC_API_BASE_URL environment variable set to https://tunocent-api.acdh-dev.oeaw.ac.at
19:     - expect: Page loads successfully
20:     - expect: TUNOCENT application is displayed
21:   2. Wait for hydration gate: await expect(page.locator('#window-root')).toBeViewport({ timeout: 30000 })
22:     - expect: App hydrated and default panel windows restored
23:     - expect: Window root element is visible in viewport
24:   3. Locate the Welcome window by title: const welcome = page.locator('.winbox', { has: page.locator('.wb-title', { hasText: /^Welcome to TUNOCENT$/ }) })
25:     - expect: Exactly one .winbox with title 'Welcome to TUNOCENT' matches
26:     - expect: Window is visible
27:   4. await expect(welcome.locator('.prose')).toBeVisible({ timeout: 15000 })
28:     - expect: The content container div.prose (v-if='data') is rendered once GET /vicav/text?id=tunocentOpeningPage resolves
29:     - expect: Text content is displayed, not an empty or spinner-only window
30:   5. await expect(welcome.locator('svg').filter({ has: page.locator('title', { hasText: /Loading/ }) })).not.toBeVisible()
31:     - expect: The centered LoadingIndicator (svg with <title>Loading...</title>) is gone
32:     - expect: isPending/isPlaceholderData are both false
33:   6. Optional: await expect(welcome.locator('.wb-body > div')).not.toHaveClass(/opacity-50/)
34:     - expect: The loading dim classes (opacity-50 grayscale) are removed from the content wrapper div once data loaded
35:   7. Failure conditions: .prose never visible within 15s, or LoadingIndicator still visible after data should have arrived
36:     - expect: Test fails if .prose never appears within 15s (text fetch failed)
37:     - expect: Test fails if the indicator persists (query stuck pending/placeholder)
38:
39: #### 1.2. TC-002: Welcome window content matches textId tunocentOpeningPage (correct text loaded)
40:
41: **File:** `e2e/pages/tunocent/text-window-display.spec.ts`
42:
43: **Steps:**
44:   1. Navigate to http://127.0.0.1:3000 and pass the hydration gate: await expect(page.locator('#window-root')).toBeInViewport({ timeout: 30000 })
45:     - expect: Default windows restored
46:   2. Locate the Welcome window: const welcome = page.locator('.winbox', { has: page.locator('.wb-title', { hasText: /^Welcome to TUNOCENT$/ }) })
47:     - expect: Exactly one window titled 'Welcome to TUNOCENT' is visible
48:   3. await expect(welcome.locator('.prose')).toBeVisible({ timeout: 15000 })
49:     - expect: Text content rendered
50:   4. Heading assertion: await expect(welcome.locator('.prose h2', { hasText: /^The TUNOCENT project$/ })).toBeVisible()
51:     - expect: The tunocentOpeningPage document heading <h2>The TUNOCENT project</h2> is present - this heading is unique to this text
52:   5. Stable body phrase 1: await expect(welcome.locator('.prose').getByText('71 Profiles')).toBeVisible()
53:     - expect: The phrase '71 Profiles' is present - referencing the number of profiles in TUNOCENT
54:   6. Stable body phrase 2: await expect(welcome.locator('.prose').getByText('195 Feature lists')).toBeVisible()
55:     - expect: The phrase '195 Feature lists' is present
56:   7. Stable body phrase 3: await expect(welcome.locator('.prose').getByText('185 Sample texts')).toBeVisible()
57:     - expect: The phrase '185 Sample texts' is present
58:   8. Stable body phrase 4: await expect(welcome.locator('.prose').getByText('24 Corpus texts')).toBeVisible()
59:     - expect: The phrase '24 Corpus texts' is present
60:   9. Stable body phrase 5: await expect(welcome.locator('.prose').getByText('Browse data')).toBeVisible()
61:     - expect: The phrase 'Browse data' is present
62:   10. Stable body phrase 6: await expect(welcome.locator('.prose').getByText('2683 entries')).toBeVisible()
63:     - expect: The phrase '2683 entries' is present - the total number of entries in Browse data
64:   11. Stable body phrase 7: await expect(welcome.locator('.prose').getByText('Research')).toBeVisible()
65:     - expect: The phrase 'Research' is present
66:   12. Notes: assertions are scoped to the Welcome window's .prose - never page-wide getByText (locator name collisions with map window's layer buttons and menu items). Phrases are contiguous within paragraphs and Playwright normalizes whitespace.

(End of file - total 66 lines)
</content>
```

---

## Assistant (Plan · MiniMax-M2.5 · 4.8s)

_Thinking:_

The test plan has been created. Let me summarize it for the user.

The test plan has been created at `specs/tunocent-text-window-display-test-plan.md`.

## Test Plan Summary

**Test:** Verify initial text is loaded on TUNOCENT instance

**Environment:**

- URL: `http://127.0.0.1:3000`
- Backend: `NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"`

**Default Window:** "Welcome to TUNOCENT" (textId: `tunocentOpeningPage`)

**Verification Phrases:**

1. Heading: `<h2>The TUNOCENT project</h2>`
2. "71 Profiles"
3. "195 Feature lists"
4. "185 Sample texts"
5. "24 Corpus texts"
6. "Browse data"
7. "2683 entries"
8. "Research"

**Test File:** `e2e/pages/tunocent/text-window-display.spec.ts`

**Run:**

```bash
NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test e2e/pages/tunocent/text-window-display.spec.ts
```

Do you want me to proceed with implementing this test?

---
