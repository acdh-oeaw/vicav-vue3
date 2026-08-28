# Update shawi menu test plan specs

**Session ID:** ses_28778bd6dffe2UVPF7SYzoPPv6 **Created:** 10.4.2026, 19:53:43 **Updated:**
10.4.2026, 19:54:00

---

## User

Read `e2e/pages/shawi/index.test.ts` and change section 1 of `specs/shawi-menu-test-plan.md` to
reflect what is already implemented.

---

## Assistant (Build · MiniMax-M2.5 · 2.8s)

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\e2e\\pages\\shawi\\index.test.ts"
}
```

**Output:**

```
<path>V:\vicav-vue3\e2e\pages\shawi\index.test.ts</path>
<type>file</type>
<content>
1: import { expect, test } from "@playwright/test";
2:
3: test.describe("home page", () => {
4: 	test("should have document title", async ({ page }) => {
5: 		await page.setViewportSize({ width: 1280, height: 720 });
6: 		await page.goto("/");
7: 		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
8: 		await expect(page).toHaveTitle("Home | SHAWI");
9: 	});
10:
11: 	// We have not decided what initial windows should be visible
12: 	// eslint-disable-next-line playwright/no-skipped-test
13: 	test.skip("should show initial windows", async ({ page }) => {
14: 		await page.setViewportSize({ width: 1280, height: 720 });
15: 		await page.goto("/");
16: 		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
17: 		// TODO: extend when there are any initial windows
18: 	});
19:
20: 	// We have not decided what initial windows should be visible
21: 	// eslint-disable-next-line playwright/no-skipped-test
22: 	test.skip("should open window menu with appropriate entries", async ({ page }) => {
23: 		await page.setViewportSize({ width: 1280, height: 720 });
24: 		await page.goto("/");
25: 		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
26: 		// TODO: extend when there are any initial windows
27: 	});
28:
29: 	test("should show footer bar with imprint link", async ({ page }) => {
30: 		await page.goto("/");
31: 		await expect(page.getByRole("link", { name: "Imprint" })).toBeVisible();
32: 	});
33:
34: 	test("should open extended footer", async ({ page }) => {
35: 		await page.goto("/");
36: 		await page
37: 			.getByRole("contentinfo")
38: 			.locator("div")
39: 			.filter({ hasText: "© 2026 ACDH |Imprint|" })
40: 			.locator("div")
41: 			.first()
42: 			.hover();
43: 		await expect(page.getByText("CONTACT")).toBeVisible();
44: 	});
45: });

(End of file - total 45 lines)
</content>
```

**Tool: read**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\specs\\shawi-menu-test-plan.md"
}
```

**Output:**

```
<path>V:\vicav-vue3\specs\shawi-menu-test-plan.md</path>
<type>file</type>
<content>
1: # SHAWI Menu Test Plan
2:
3: This plan was generated using AI (MiniMax-m2.5) and opencode using the prompt
4:
5: > Using @playwright-test-planner inspect http://127.0.0.1:3000 and create a second test plan
6: > `specs/shawi-menu-test-plan.md`.
7:
8: It was slightly edited after generation.
9:
10: ## Application Overview
11:
12: Comprehensive test plan for SHAWI (SHAWI - Shared Arabic World Information) application menu system.
13: SHAWI is a web-based corpus interface for Arabic varieties managed by ACDH. This test plan covers
14: all menu functionality, window management, navigation, and user interactions.
15:
16: ## Test Scenarios
17:
18: ### 1. Home Page
19:
20: **Seed:** `e2e/seed.spec.ts`
21:
22: #### 1.1. Home Page - Document Title
23:
24: **File:** `e2e/pages/shawi/index.test.ts`
25:
26: **Steps:**
27:
28: 1. Navigate to http://127.0.0.1:3000/ and wait for page load
29:    - expect: Page should have title 'Home | SHAWI'
30:
31: #### 1.2. Home Page - Main Heading
32:
33: **File:** `e2e/pages/shawi/index.test.ts`
34:
35: **Steps:**
36:
37: 1. Navigate to http://127.0.0.1:3000/ and locate the main heading element
38:    - expect: Should display heading 'VICAV - Vienna Corpus of Arabic Varieties'
39:
40: #### 1.3. Home Page - Skip to Main Content Link
41:
42: **File:** `e2e/pages/shawi/index.test.ts`
43:
44: **Steps:**
45:
46: 1. Navigate to home page and verify skip link presence
47:    - expect: Skip to main content link should be visible and accessible
48:
49: ### 2. Menu Bar - Desktop
50:
51: **Seed:** `e2e/seed.spec.ts`
52:
53: #### 2.1. Desktop Menu - All Menu Items Visible
54:
55: **File:** `e2e/pages/shawi/menu/desktop-menu-rendering.test.ts`
56:
57: **Steps:**
58:
59: 1. Navigate to home page and verify menu bar contains About, Profiles, Corpus, Glossary, Windows
60:    menu items
61:    - expect: All five menu items should be visible: About, Profiles, Corpus, Glossary, Windows
62:
63: #### 2.2. Desktop Menu - About Menu Content
64:
65: **File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`
66:
67: **Steps:**
68:
69: 1. Click on About menu item and verify submenu items
70:    - expect: About menu should contain: About, Team, News
71:
72: #### 2.3. Desktop Menu - Profiles Menu Content
73:
74: **File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`
75:
76: **Steps:**
77:
78: 1. Click on Profiles menu item and verify submenu items
79:    - expect: Profiles menu should contain: Explanation, Show All Locations, List all entries,
80:      Contribute a Profile
81:
82: #### 2.4. Desktop Menu - Corpus Menu Content
83:
84: **File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`
85:
86: **Steps:**
87:
88: 1. Click on Corpus menu item and verify submenu items
89:    - expect: Corpus menu should contain: List all entries, Search the corpus, Functional
90:      Requirements and Data Specification
91:
92: #### 2.5. Desktop Menu - Glossary Menu Content
93:
94: **File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`
95:
96: **Steps:**
97:
98: 1. Click on Glossary menu item and verify submenu items
99:    - expect: Glossary menu should contain: Search for vocabulary in corpus texts, Functional
100:      Requirements and Data Specification
101:
102: #### 2.6. Desktop Menu - Windows Menu Content
103:
104: **File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`
105:
106: **Steps:**
107:
108: 1. Click on Windows menu item and verify submenu items
109:    - expect: Windows menu should contain: No windows open, Arrangement section with None, Cascade,
110:      Tile, Smart tile, Column 5 Flex
111:
112: #### 2.7. Desktop Menu - Single Menu Open Behavior
113:
114: **File:** `e2e/pages/shawi/menu/single-menu-open.test.ts`
115:
116: **Steps:**
117:
118: 1. 1. Click on About menu to open it
119: 2. Click on Profiles menu
120: 3. Verify About menu is closed and Profiles menu is open
121:    - expect: Only one dropdown menu should be open at a time when clicking different menu items
122:
123: #### 2.8. Desktop Menu - Close Menu When Clicking Outside
124:
125: **File:** `e2e/pages/shawi/menu/menu-close-outside.test.ts`
126:
127: **Steps:**
128:
129: 1. 1. Open any menu (e.g., About)
130: 2. Click on the main content area
131: 3. Verify the menu is closed
132:    - expect: Menu should close when clicking on main content area outside the menu
133:
134: #### 2.9. Desktop Menu - Separator Lines Present
135:
136: **File:** `e2e/pages/shawi/menu/desktop-menu-separators.test.ts`
137:
138: **Steps:**
139:
140: 1. Open Windows menu and verify separator between 'No windows open' and 'Arrangement' sections
141:    - expect: Separator lines should be visible between menu sections where applicable
142:
143: ### 3. Window Management
144:
145: **Seed:** `e2e/seed.spec.ts`
146:
147: #### 3.1. Windows Menu - Arrangement Options Display
148:
149: **File:** `e2e/pages/shawi/windows/windows-dropdown.test.ts`
150:
151: **Steps:**
152:
153: 1. Open Windows menu and verify None, Cascade, Tile, Smart tile, Column 5 Flex options are present
154:    - expect: All window arrangement options should be visible and selectable
155:
156: #### 3.2. Windows Menu - Open News Window
157:
158: **File:** `e2e/pages/shawi/windows/windows-selection.test.ts`
159:
160: **Steps:**
161:
162: 1. 1. Open About menu
163: 2. Click on News menu item
164: 3. Verify News window opens with appropriate content
165:    - expect: Clicking on News should open a window with News content
166:
167: #### 3.3. Windows Menu - Open About Window
168:
169: **File:** `e2e/pages/shawi/windows/windows-selection.test.ts`
170:
171: **Steps:**
172:
173: 1. 1. Open About menu
174: 2. Click on About menu item
175: 3. Verify About window opens
176:    - expect: Clicking on About should open About content in a window
177:
178: #### 3.4. Windows Menu - Open Team Window
179:
180: **File:** `e2e/pages/shawi/windows/windows-selection.test.ts`
181:
182: **Steps:**
183:
184: 1. 1. Open About menu
185: 2. Click on Team menu item
186: 3. Verify Team window opens
187:    - expect: Clicking on Team should open Team content in a window
188:
189: #### 3.5. Windows Arrangement - Tile Mode
190:
191: **File:** `e2e/pages/shawi/windows/windows-arrangement-tile.test.ts`
192:
193: **Steps:**
194:
195: 1. 1. Open two windows (e.g., About and News)
196: 2. Open Windows menu
197: 3. Select Tile arrangement
198: 4. Verify windows are arranged in tile layout
199:    - expect: Windows should arrange in tile layout when Tile option is selected
200:
201: #### 3.6. Windows Arrangement - Cascade Mode
202:
203: **File:** `e2e/pages/shawi/windows/windows-arrangement-cascade.test.ts`
204:
205: **Steps:**
206:
207: 1. 1. Open two windows
208: 2. Open Windows menu
209: 3. Select Cascade arrangement
210: 4. Verify windows are arranged in cascade layout
211:    - expect: Windows should arrange in cascade layout when Cascade option is selected
212:
213: #### 3.7. Windows Arrangement - Smart Tile Mode
214:
215: **File:** `e2e/pages/shawi/windows/windows-arrangement-smart-tile.test.ts`
216:
217: **Steps:**
218:
219: 1. 1. Open multiple windows
220: 2. Open Windows menu
221: 3. Select Smart tile arrangement
222: 4. Verify windows are arranged in smart tile layout
223:    - expect: Windows should arrange in smart tile layout when Smart tile option is selected
224:
225: #### 3.8. Windows - Multiple Windows Open
226:
227: **File:** `e2e/pages/shawi/windows/windows-integration.test.ts`
228:
229: **Steps:**
230:
231: 1. 1. Open About window
232: 2. Open News window
233: 3. Verify both windows are visible and content loads correctly
234:    - expect: Multiple windows can be open simultaneously and display correctly
235:
236: #### 3.9. Windows - URL Updates with Window State
237:
238: **File:** `e2e/pages/shawi/windows/windows-integration.test.ts`
239:
240: **Steps:**
241:
242: 1. 1. Note initial URL
243: 2. Open a window (e.g., News)
244: 3. Verify URL contains window parameter (w=)
245:    - expect: URL should update with window parameters when windows are opened
246:
247: ### 4. Keyboard Navigation
248:
249: **Seed:** `e2e/seed.spec.ts`
250:
251: #### 4.1. Keyboard - Tab Navigation Through Menu
252:
253: **File:** `e2e/pages/shawi/keyboard/keyboard-tab-navigation.test.ts`
254:
255: **Steps:**
256:
257: 1. 1. Press Tab key multiple times
258: 2. Verify focus moves through menu items in the menubar
259:    - expect: Tab key should navigate through menu items in logical order
260:
261: #### 4.2. Keyboard - Arrow Key Navigation Within Menu
262:
263: **File:** `e2e/pages/shawi/keyboard/keyboard-arrow-navigation.test.ts`
264:
265: **Steps:**
266:
267: 1. 1. Open a menu (e.g., About)
268: 2. Use arrow keys to navigate through menu items
269: 3. Verify focus moves correctly
270:    - expect: Arrow keys should navigate between menu items within an open dropdown
271:
272: #### 4.3. Keyboard - Enter Key to Select Menu Item
273:
274: **File:** `e2e/pages/shawi/keyboard/keyboard-enter.test.ts`
275:
276: **Steps:**
277:
278: 1. 1. Navigate to a menu item using keyboard
279: 2. Press Enter
280: 3. Verify the corresponding action is performed
281:    - expect: Enter key should select the focused menu item and open corresponding window
282:
283: #### 4.4. Keyboard - Escape Key to Close Menu
284:
285: **File:** `e2e/pages/shawi/keyboard/keyboard-escape.test.ts`
286:
287: **Steps:**
288:
289: 1. 1. Open a menu
290: 2. Press Escape key
291: 3. Verify menu is closed
292:    - expect: Escape key should close the open dropdown menu
293:
294: ### 5. Footer
295:
296: **Seed:** `e2e/seed.spec.ts`
297:
298: #### 5.1. Footer - Basic Elements Present
299:
300: **File:** `e2e/pages/shawi/footer/footer-basic.test.ts`
301:
302: **Steps:**
303:
304: 1. Navigate to home page and verify footer contains: © 2026, ACDH link, Imprint link, Frontend
305:    version, Backend version, Data version
306:    - expect: Footer should display copyright, ACDH link, Imprint link, and version info
307:
308: #### 5.2. Footer - Imprint Link Functionality
309:
310: **File:** `e2e/pages/shawi/footer/footer-imprint-link.test.ts`
311:
312: **Steps:**
313:
314: 1. 1. Click on Imprint link in footer
315: 2. Verify URL changes to /imprint
316: 3. Verify page title is 'Imprint | SHAWI'
317:    - expect: Clicking Imprint link should navigate to /imprint page
318:
319: #### 5.3. Footer - ACDH Link Functionality
320:
321: **File:** `e2e/pages/shawi/footer/footer-acdh-link.test.ts`
322:
323: **Steps:**
324:
325: 1. 1. Click on ACDH link in footer
326: 2. Verify link href points to https://www.oeaw.ac.at/acdh
327:    - expect: Clicking ACDH link should navigate to https://www.oeaw.ac.at/acdh
328:
329: #### 5.4. Footer - Extended Footer on Hover
330:
331: **File:** `e2e/pages/shawi/footer/footer-extended.test.ts`
332:
333: **Steps:**
334:
335: 1. 1. Hover over the footer area
336: 2. Verify extended footer becomes visible with CONTACT section
337: 3. Verify ACDH address and contact details are shown
338:    - expect: Hovering over footer should reveal extended contact information
339:
340: ### 6. Imprint Page
341:
342: **Seed:** `e2e/seed.spec.ts`
343:
344: #### 6.1. Imprint Page - Document Title
345:
346: **File:** `e2e/pages/shawi/imprint/imprint-page.test.ts`
347:
348: **Steps:**
349:
350: 1. Navigate to /imprint and verify page title
351:    - expect: Page title should be 'Imprint | SHAWI'
352:
353: #### 6.2. Imprint Page - Legal Content Present
354:
355: **File:** `e2e/pages/shawi/imprint/imprint-page.test.ts`
356:
357: **Steps:**
358:
359: 1. Navigate to /imprint and verify main content contains 'Legal disclosure' text
360:    - expect: Imprint page should contain legal disclosure text
361:
362: #### 6.3. Imprint Page - Navigate Back Functionality
363:
364: **File:** `e2e/pages/shawi/imprint/imprint-page.test.ts`
365:
366: **Steps:**
367:
368: 1. 1. Navigate to /imprint
369: 2. Click on 'Navigate Back' or shawi logo
370: 3. Verify return to home page
371:    - expect: Should be able to navigate back to home from imprint page
372:
373: ### 7. Accessibility
374:
375: **Seed:** `e2e/seed.spec.ts`
376:
377: #### 7.1. Accessibility - Menu ARIA Roles
378:
379: **File:** `e2e/pages/shawi/accessibility/menu-aria-attributes.test.ts`
380:
381: **Steps:**
382:
383: 1. 1. Open a menu
384: 2. Verify menubar has role='menubar'
385: 3. Verify menuitems have role='menuitem'
386:    - expect: Menu should have proper ARIA roles and attributes for screen readers
387:
388: #### 7.2. Accessibility - Keyboard Accessibility
389:
390: **File:** `e2e/pages/shawi/accessibility/menu-keyboard-accessibility.test.ts`
391:
392: **Steps:**
393:
394: 1. 1. Verify all interactive elements are focusable
395: 2. Verify menu can be opened, navigated, and items selected using only keyboard
396:    - expect: All menu functions should be accessible via keyboard only
397:
398: #### 7.3. Accessibility - Skip to Main Content Link
399:
400: **File:** `e2e/pages/shawi/accessibility/skip-link.test.ts`
401:
402: **Steps:**
403:
404: 1. 1. Press Tab key on page load
405: 2. Verify first focusable element is 'Skip to main content' link
406:    - expect: Skip to main content link should be first focusable element
407:
408: ### 8. Edge Cases and Error Handling
409:
410: **Seed:** `e2e/seed.spec.ts`
411:
412: #### 8.1. Error Handling - API Error Display
413:
414: **File:** `e2e/pages/shawi/error/api-error-handling.test.ts`
415:
416: **Steps:**
417:
418: 1. Test application behavior when backend API returns errors (verify console for errors)
419:    - expect: Application should display appropriate error messages when API fails
420:
421: #### 8.2. Loading State - Menu Loading
422:
423: **File:** `e2e/pages/shawi/error/loading-state.test.ts`
424:
425: **Steps:**
426:
427: 1. Verify menu items appear only after data is loaded
428:    - expect: Menu should show loading state while fetching menu data
429:
430: #### 8.3. Edge Case - No Windows Open State
431:
432: **File:** `e2e/pages/shawi/error/empty-menu.test.ts`
433:
434: **Steps:**
435:
436: 1. Open Windows menu on fresh page load and verify 'No windows open' message
437:    - expect: Windows menu should show 'No windows open' when no windows are open
438:
439: ### 9. Responsive Behavior
440:
441: **Seed:** `e2e/seed.spec.ts`
442:
443: #### 9.1. Responsive - Desktop Menu Display
444:
445: **File:** `e2e/pages/shawi/responsive/desktop-view.test.ts`
446:
447: **Steps:**
448:
449: 1. Set viewport to 1280x720 and verify menu displays horizontally
450:    - expect: Menu should display horizontally on desktop (1280px+)
451:
452: #### 9.2. Responsive - Menu Behavior at Different Sizes
453:
454: **File:** `e2e/pages/shawi/responsive/responsive-breakpoint.test.ts`
455:
456: **Steps:**
457:
458: 1. Test menu at various viewport sizes: 1920px, 1280px, 1024px, 768px
459:    - expect: Menu should adapt appropriately at different viewport sizes
460:
461: ### 10. Project News and Mission
462:
463: **Seed:** `e2e/seed.spec.ts`
464:
465: #### 10.1. Project - News Window Content
466:
467: **File:** `e2e/pages/shawi/project/project-news.test.ts`
468:
469: **Steps:**
470:
471: 1. Open About > News window and verify content includes date and news entries
472:    - expect: News window should display project news content
473:
474: #### 10.2. Project - About Window Content
475:
476: **File:** `e2e/pages/shawi/project/project-mission.test.ts`
477:
478: **Steps:**
479:
480: 1. Open About > About window and verify content is displayed
481:    - expect: About window should display project information
482:
483: #### 10.3. Project - Team Window Content
484:
485: **File:** `e2e/pages/shawi/project/project-team.test.ts`
486:
487: **Steps:**
488:
489: 1. Open About > Team window and verify content is displayed
490:    - expect: Team window should display team information

(End of file - total 490 lines)
</content>
```

---

## Assistant (Build · MiniMax-M2.5 · 10.8s)

Based on the test file, section 1 needs to reflect what's actually implemented. The file has:

- Document title test (implemented)
- Skipped: initial windows test
- Skipped: window menu test
- Footer imprint link (implemented)
- Extended footer (implemented)

Let me update section 1:

**Tool: edit**

**Input:**

```json
{
	"filePath": "V:\\vicav-vue3\\specs\\shawi-menu-test-plan.md",
	"newString": "### 1. Home Page\n\n**Seed:** `e2e/seed.spec.ts`\n\n#### 1.1. Home Page - Document Title\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to http://127.0.0.1:3000/ and wait for page load\n   - expect: Page should have title 'Home | SHAWI'\n\n**Status:** Implemented\n\n#### 1.2. Home Page - Initial Windows\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to http://127.0.0.1:3000/ and wait for page load\n   - expect: Initial windows should be visible\n\n**Status:** Not yet implemented (test is skipped)\n\n#### 1.3. Home Page - Window Menu\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to http://127.0.0.1:3000/ and verify window menu\n   - expect: Window menu should have appropriate entries\n\n**Status:** Not yet implemented (test is skipped)\n\n#### 1.4. Home Page - Footer Bar with Imprint Link\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to http://127.0.0.1:3000/\n2. Verify Imprint link is visible in footer\n   - expect: Imprint link should be visible in footer\n\n**Status:** Implemented\n\n#### 1.5. Home Page - Extended Footer on Hover\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to http://127.0.0.1:3000/\n2. Hover over footer area\n3. Verify CONTACT section becomes visible\n   - expect: Extended footer with CONTACT should be visible on hover\n\n**Status:** Implemented",
	"oldString": "### 1. Home Page\n\n**Seed:** `e2e/seed.spec.ts`\n\n#### 1.1. Home Page - Document Title\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to http://127.0.0.1:3000/ and wait for page load\n   - expect: Page should have title 'Home | SHAWI'\n\n#### 1.2. Home Page - Main Heading\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to http://127.0.0.1:3000/ and locate the main heading element\n   - expect: Should display heading 'VICAV - Vienna Corpus of Arabic Varieties'\n\n#### 1.3. Home Page - Skip to Main Content Link\n\n**File:** `e2e/pages/shawi/index.test.ts`\n\n**Steps:**\n\n1. Navigate to home page and verify skip link presence\n   - expect: Skip to main content link should be visible and accessible"
}
```

**Output:**

```
Edit applied successfully.
```

---

## Assistant (Build · MiniMax-M2.5 · 3.4s)

Updated section 1 to reflect what's actually implemented:

- **1.1 Document Title** - Implemented (matches `test("should have document title")`)
- **1.2 Initial Windows** - Not implemented (test is skipped)
- **1.3 Window Menu** - Not implemented (test is skipped)
- **1.4 Footer Bar with Imprint Link** - Implemented
- **1.5 Extended Footer on Hover** - Implemented

Removed the non-existent tests for "Main Heading" and "Skip to Main Content Link" that were in the
original plan.

---
