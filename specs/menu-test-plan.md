# VICAV Vue 3 Application - Menu Test Plan

## Overview

This test plan covers the comprehensive testing of the VICAV Vue 3 application's navigation menu
system. The menu items are dynamically fetched from an API and cannot be hardcoded in tests. All
menu interactions, responsive behavior, and edge cases are documented below.

**Application Under Test:** VICAV3.0 - Vienna Corpus of Arabic Varieties  
**Base URL:** http://localhost:3000  
**Test Framework:** Playwright  
**Last Updated:** 2026-04-01

---

## 1. Discovered Menu Structure

### 1.1 Desktop Menu (Viewport >= 1024px)

The desktop menu is displayed as a horizontal navigation bar using Radix UI Menubar component with
the following menu categories:

| Menu Category          | Dropdown Items                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project**            | Mission, News, Types of Text/Data, Contributors, Linguistics                                                                                                                                                                                                                                                                                                                                       |
| **Bibliographies**     | Explanation, All Bibl. Locations on Map, All Bibl. Regions on Map, All Bibl. Dialect Regions on Map, All Dictionaries in Bibl. on Map, All Textbooks in Bibl. on Map, Query Bibliography, Contribute to the Bibliography                                                                                                                                                                           |
| **Profiles**           | Explanation + List, Show All Profiles on Map, Contribute a Profile                                                                                                                                                                                                                                                                                                                                 |
| **Feature Lists**      | Explanation, Cross-examine the VICAV Feature Lists, Show All Feature Lists on Map, Contribute a Feature List                                                                                                                                                                                                                                                                                       |
| **Samples**            | Explanation, Show All Samples on Map, Contribute a Sample Text                                                                                                                                                                                                                                                                                                                                     |
| **Texts**              | Explanation and Overview                                                                                                                                                                                                                                                                                                                                                                           |
| **Dictionaries**       | All Dictionaries in Bibl. on Map, All VICAV Dictionaries on Map, Query the VICAV Dictionaries, TUNICO Dictionary, Damascus Dictionary, Cairo Dictionary, Baghdad Dictionary, MSA Dictionary, Technicalities, Contribute a Dictionary/Glossary                                                                                                                                                      |
| **Tools & Technology** | Dictionary Editor (VLE), Arabic Research Tools, Corpora (Spoken Varieties), Corpora (MSA), Special Corpora, Corpora (Historical Varieties), Dictionaries, Language Processing Tools, Other Websites & Projects, Learning Materials, Textbook Syrian Arabic (Sound files), Textbook Baghdad Arabic (Sound files), Vocabularies on Smartphones, Available Programs, Available Data, Keyboard Layouts |
| **Windows**            | Mission, News, All Bibl. Locations on Map, Arrangement (None, Cascade, Tile, Smart tile, Column 5 Flex)                                                                                                                                                                                                                                                                                            |

### 1.2 Mobile Menu (Viewport < 1024px)

The mobile menu is triggered by a "Toggle menu" button using Sheet component. When opened, it
displays a dialog with expandable menu categories:

- Project
- Bibliographies
- Profiles
- Feature Lists
- Samples
- Texts
- Dictionaries
- Tools & Technology

Each category expands to reveal its sub-items in a collapsible list format.

---

## 2. Test Suites

### 2.1 Desktop Menu Rendering Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.1.1 Desktop menu renders menu items from API

**File:** `e2e/pages/vicav/menu/desktop-menu-rendering.spec.ts`

**Steps:**

1. Navigate to homepage at http://localhost:3000 on desktop viewport (1280x720)
   - expect: Page should load without errors
   - expect: Header should be visible
   - expect: Desktop menu (Menubar) should be visible on desktop viewport (≥1024px)
   - expect: Menu items should be visible with correct titles from API
2. Resize viewport to mobile (375x667) and verify desktop menu is hidden
   - expect: Desktop menu should not be visible on mobile viewport (<1024px)
3. Verify mobile menu toggle button is visible on small viewport
   - expect: Mobile menu trigger button should be visible on mobile viewport

#### 2.1.2 All Desktop Menu Categories are Visible

**File:** `e2e/pages/vicav/menu/desktop-all-categories.spec.ts`

**Steps:**

1. Navigate to homepage
2. Verify the following menu items are visible:
   - Project
   - Bibliographies
   - Profiles
   - Feature Lists
   - Samples
   - Texts
   - Dictionaries
   - Tools & Technology
   - Windows
   - expect: All 9 menu categories should be visible in the navigation bar

---

### 2.2 Desktop Menu Interaction Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.2.1 Project Menu Dropdown Opens and Displays All Items

**File:** `e2e/pages/vicav/menu/project-dropdown.spec.ts`

**Steps:**

1. Navigate to the homepage
2. Click on the "Project" menu item
3. Verify the dropdown menu appears with the following items:
   - Mission
   - News
   - Types of Text/Data
   - Contributors
   - Linguistics
   - expect: Project menu should be expanded (active state)
   - expect: Dropdown should display all 5 menu items
   - expect: Each menu item should be clickable

#### 2.2.2 Bibliographies Menu Dropdown Opens and Displays All Items

**File:** `e2e/pages/vicav/menu/bibliographies-dropdown.spec.ts`

**Steps:**

1. Navigate to the homepage
2. Click on the "Bibliographies" menu item
3. Verify the dropdown menu appears with the following items:
   - Explanation
   - All Bibl. Locations on Map
   - All Bibl. Regions on Map
   - All Bibl. Dialect Regions on Map
   - All Dictionaries in Bibl. on Map
   - All Textbooks in Bibl. on Map
   - Query Bibliography
   - Contribute to the Bibliography
   - expect: Bibliographies menu should be expanded
   - expect: Dropdown should display all 8 menu items with proper separators

#### 2.2.3 Profiles Menu Dropdown

**File:** `e2e/pages/vicav/menu/profiles-dropdown.spec.ts`

**Steps:**

1. Click on "Profiles" menu item
2. Verify dropdown contains:
   - Explanation + List
   - Show All Profiles on Map
   - Contribute a Profile
   - expect: All 3 menu items are visible and clickable

#### 2.2.4 Feature Lists Menu Dropdown

**File:** `e2e/pages/vicav/menu/feature-lists-dropdown.spec.ts`

**Steps:**

1. Click on "Feature Lists" menu item
2. Verify dropdown contains:
   - Explanation
   - Cross-examine the VICAV Feature Lists
   - Show All Feature Lists on Map
   - Contribute a Feature List
   - expect: All 4 menu items are visible and clickable

#### 2.2.5 Samples Menu Dropdown

**File:** `e2e/pages/vicav/menu/samples-dropdown.spec.ts`

**Steps:**

1. Click on "Samples" menu item
2. Verify dropdown contains:
   - Explanation
   - Show All Samples on Map
   - Contribute a Sample Text
   - expect: All 3 menu items are visible and clickable

#### 2.2.6 Texts Menu Dropdown

**File:** `e2e/pages/vicav/menu/texts-dropdown.spec.ts`

**Steps:**

1. Click on "Texts" menu item
2. Verify dropdown contains:
   - Explanation and Overview
   - expect: Single menu item is visible

#### 2.2.7 Dictionaries Menu Dropdown

**File:** `e2e/pages/vicav/menu/dictionaries-dropdown.spec.ts`

**Steps:**

1. Click on "Dictionaries" menu item
2. Verify dropdown contains:
   - All Dictionaries in Bibl. on Map
   - All VICAV Dictionaries on Map
   - Query the VICAV Dictionaries
   - TUNICO Dictionary
   - Damascus Dictionary
   - Cairo Dictionary
   - Baghdad Dictionary
   - MSA Dictionary
   - Technicalities
   - Contribute a Dictionary/Glossary
   - expect: All 10 menu items are visible with proper separators

#### 2.2.8 Tools & Technology Menu Dropdown

**File:** `e2e/pages/vicav/menu/tools-technology-dropdown.spec.ts`

**Steps:**

1. Click on "Tools & Technology" menu item
2. Verify dropdown contains:
   - Dictionary Editor (VLE)
   - Arabic Research Tools
   - Corpora (Spoken Varieties)
   - Corpora (MSA)
   - Special Corpora
   - Corpora (Historical Varieties)
   - Dictionaries
   - Language Processing Tools
   - Other Websites & Projects
   - Learning Materials
   - Textbook Syrian Arabic (Sound files)
   - Textbook Baghdad Arabic (Sound files)
   - Vocabularies on Smartphones
   - Available Programs
   - Available Data
   - Keyboard Layouts
   - expect: All 16 menu items are visible and clickable

#### 2.2.9 Windows Menu Dropdown

**File:** `e2e/pages/vicav/menu/windows-dropdown.spec.ts`

**Steps:**

1. Click on "Windows" menu item
2. Verify dropdown contains:
   - Windows (3) - header showing count
   - Mission
   - News
   - All Bibl. Locations on Map
   - Arrangement section with:
     - None
     - Cascade
     - Tile
     - Smart tile (with icon)
     - Column 5 Flex
   - expect: Windows menu displays open windows and arrangement options

#### 2.2.10 Menu Closes When Clicking Outside

**File:** `e2e/pages/vicav/menu/menu-close-outside.spec.ts`

**Steps:**

1. Open any menu dropdown (e.g., Project)
2. Click on the main content area of the page
3. Verify the dropdown is closed
   - expect: Dropdown menu should close when clicking outside

#### 2.2.11 Only One Menu Dropdown Open at a Time

**File:** `e2e/pages/vicav/menu/single-menu-open.spec.ts`

**Steps:**

1. Open the "Project" menu
2. Click on "Bibliographies" menu
3. Verify that Project menu is closed and Bibliographies is open
   - expect: Only one dropdown should be open at a time

---

### 2.3 Mobile Menu Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.3.1 Mobile Menu Renders Menu Items from API

**File:** `e2e/pages/vicav/menu/mobile-menu-rendering.spec.ts`

**Steps:**

1. Navigate to homepage at http://localhost:3000 on mobile viewport (375x667)
   - expect: Page should load without errors
   - expect: Header should be visible
2. Click the mobile menu toggle button
   - expect: Mobile menu sheet should open when toggle button is clicked
   - expect: Mobile menu should display all menu categories with their items
3. Click outside the mobile menu sheet to close it
   - expect: Mobile menu should close when clicking outside or on a menu item

#### 2.3.2 Mobile Toggle Button is Visible Below 1024px

**File:** `e2e/pages/vicav/menu/mobile-toggle-visible.spec.ts`

**Steps:**

1. Set viewport to 480x800 (mobile)
2. Navigate to the homepage
3. Locate the "Toggle menu" button
   - expect: Toggle menu button should be visible in the navigation area

#### 2.3.3 Mobile Menu Opens on Toggle Click

**File:** `e2e/pages/vicav/menu/mobile-menu-open.spec.ts`

**Steps:**

1. Set viewport to 480x800
2. Navigate to the homepage
3. Click the "Toggle menu" button
4. Verify a dialog/overlay with "Navigation menu" appears
   - expect: Mobile navigation dialog should appear with all main menu categories

#### 2.3.4 Mobile Menu Displays All Categories

**File:** `e2e/pages/vicav/menu/mobile-categories.spec.ts`

**Steps:**

1. Open mobile menu
2. Verify the following categories are listed:
   - Project
   - Bibliographies
   - Profiles
   - Feature Lists
   - Samples
   - Texts
   - Dictionaries
   - Tools & Technology
   - expect: All 8 menu categories are visible in the mobile navigation

#### 2.3.5 Mobile Menu Categories Expand on Click

**File:** `e2e/pages/vicav/menu/mobile-category-expand.spec.ts`

**Steps:**

1. Open mobile menu
2. Click on "Bibliographies" category
3. Verify sub-items are displayed:
   - Explanation
   - All Bibl. Locations on Map
   - All Bibl. Regions on Map
   - All Bibl. Dialect Regions on Map
   - All Dictionaries in Bibl. on Map
   - All Textbooks in Bibl. on Map
   - Query Bibliography
   - Contribute to the Bibliography
   - expect: Category expands to show all sub-items in a list

#### 2.3.6 Mobile Menu Closes on Close Button

**File:** `e2e/pages/vicav/menu/mobile-menu-close.spec.ts`

**Steps:**

1. Open mobile menu
2. Click the close button (X icon)
3. Verify the mobile menu dialog is closed
   - expect: Mobile navigation dialog should close

#### 2.3.7 Mobile Menu Closes When Clicking a Menu Item

**File:** `e2e/pages/vicav/menu/mobile-selection-close.spec.ts`

**Steps:**

1. Open mobile menu
2. Click on any expanded sub-item
3. Verify the mobile menu dialog closes
   - expect: Mobile navigation dialog should close after selecting an item

---

### 2.4 Responsive Behavior Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.4.1 Menu switches between desktop and mobile at 1024px breakpoint

**File:** `e2e/pages/vicav/menu/responsive-breakpoint.spec.ts`

**Steps:**

1. Navigate to homepage and set viewport to 1024x768
   - expect: Page should load with desktop menu visible at 1024px width
2. Verify visible elements at 1024px width
   - expect: Desktop menu (Menubar) should be visible
   - expect: Mobile menu toggle should NOT be visible
3. Resize viewport to 1280x720 and verify desktop menu
   - expect: Desktop menu should remain visible at widths > 1024px
4. Resize viewport to 1023x768
   - expect: At 1023px width, mobile menu should appear and desktop menu should hide
5. Verify mobile menu is shown at < 1024px
   - expect: At 1023px width, mobile menu toggle should be visible
   - expect: Desktop menu should NOT be visible

#### 2.4.2 Window list dropdown visible on both desktop and mobile

**File:** `e2e/pages/vicav/menu/responsive-window-list.spec.ts`

**Steps:**

1. Navigate to homepage at 1280x720
   - expect: Page should load on desktop viewport
2. Locate and verify Windows dropdown in desktop menu
   - expect: Windows dropdown should be visible in desktop menu bar
   - expect: Windows dropdown should show window count when windows are open
3. Resize to mobile viewport and verify Windows dropdown in mobile menu
   - expect: Windows dropdown should be visible in mobile menu
   - expect: Windows dropdown should show window count

---

### 2.5 Keyboard Navigation Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.5.1 Tab Navigation Through Menu Items

**File:** `e2e/pages/vicav/menu/keyboard-tab-navigation.spec.ts`

**Steps:**

1. Navigate to homepage
2. Press Tab key repeatedly
3. Verify focus moves through menu items in order
   - expect: Focus indicator should be visible on each menu item as Tab is pressed

#### 2.5.2 Enter Key Opens Focused Menu

**File:** `e2e/pages/vicav/menu/keyboard-enter.spec.ts`

**Steps:**

1. Navigate to homepage
2. Press Tab until focus is on "Project" menu
3. Press Enter
4. Verify Project dropdown opens
   - expect: Dropdown menu should open when Enter is pressed

#### 2.5.3 Escape Key Closes Open Dropdown

**File:** `e2e/pages/vicav/menu/keyboard-escape.spec.ts`

**Steps:**

1. Navigate to homepage
2. Click on "Project" menu to open dropdown
3. Press Escape key
4. Verify dropdown is closed
   - expect: Dropdown should close when Escape is pressed

#### 2.5.4 Arrow Keys Navigate Within Dropdown

**File:** `e2e/pages/vicav/menu/keyboard-arrow-navigation.spec.ts`

**Steps:**

1. Open "Project" menu
2. Use Down Arrow to navigate through sub-items
3. Verify focus moves through: Mission -> News -> Types of Text/Data -> Contributors -> Linguistics
   - expect: Each sub-item should receive focus in sequence

---

### 2.6 Menu Item Interaction Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.6.1 Clicking Project > Mission Opens Mission Window

**File:** `e2e/pages/vicav/menu/project-mission.spec.ts`

**Steps:**

1. Navigate to homepage
2. Click on "Project" menu
3. Click on "Mission" sub-item
4. Verify a window/popup with "Mission" content appears
   - expect: New window opens displaying Mission information

#### 2.6.2 Clicking Project > News Opens News Window

**File:** `e2e/pages/vicav/menu/project-news.spec.ts`

**Steps:**

1. Navigate to homepage
2. Click on "Project" menu
3. Click on "News" sub-item
4. Verify a window/popup with "News" content appears
   - expect: New window opens displaying News content

#### 2.6.3 Windows Menu Item Selection

**File:** `e2e/pages/vicav/menu/windows-selection.spec.ts`

**Steps:**

1. First, open Mission and News windows (via Project menu)
2. Click on "Windows" menu
3. Click on "Mission" in the Windows dropdown
4. Verify focus moves to the Mission window
   - expect: Mission window should receive focus

#### 2.6.4 Windows Arrangement - Cascade

**File:** `e2e/pages/vicav/menu/windows-arrangement-cascade.spec.ts`

**Steps:**

1. Open multiple windows (Mission, News, Map)
2. Click on "Windows" menu
3. Click on "Cascade" arrangement option
4. Verify windows are arranged in cascade pattern
   - expect: Windows are visually cascaded on the page

#### 2.6.5 Windows Arrangement - Tile

**File:** `e2e/pages/vicav/menu/windows-arrangement-tile.spec.ts`

**Steps:**

1. Open multiple windows
2. Click on "Windows" menu
3. Click on "Tile" arrangement option
4. Verify windows are arranged in tile pattern
   - expect: Windows are visually tiled on the page

#### 2.6.6 Windows Arrangement - Smart Tile

**File:** `e2e/pages/vicav/menu/windows-arrangement-smart-tile.spec.ts`

**Steps:**

1. Open multiple windows
2. Click on "Windows" menu
3. Click on "Smart tile" arrangement option
4. Verify windows are arranged in smart tile pattern
   - expect: Windows are arranged in a smart tile pattern

---

### 2.7 Edge Cases and Error Handling

**Seed:** `e2e/seed.spec.ts`

#### 2.7.1 Menu handles empty API response gracefully

**File:** `e2e/pages/vicav/menu/empty-menu.spec.ts`

**Steps:**

1. Mock API to return empty menu array and navigate to homepage
   - expect: Page should load without errors even if menu API returns empty array
2. Verify menu components are conditionally rendered
   - expect: No menu should be rendered when menus array is empty
   - expect: Desktop menu should not be visible
   - expect: Mobile menu toggle should not be visible

#### 2.7.2 Menu handles API errors gracefully

**File:** `e2e/pages/vicav/menu/api-error-handling.spec.ts`

**Steps:**

1. Mock API to return error and navigate to homepage
   - expect: Page should load even if API request fails
2. Verify page still displays header, footer, and other content
   - expect: Menu should not render when API request fails
   - expect: Page should remain functional with other elements

#### 2.7.3 Menu handles loading state during API fetch

**File:** `e2e/pages/vicav/menu/loading-state.spec.ts`

**Steps:**

1. Navigate to homepage with slow network simulation
   - expect: Initial page load should show loading state or skeleton while API fetches
2. Wait for API response and verify menu renders correctly
   - expect: Menu should appear once API data loads
   - expect: No error messages should be visible

#### 2.7.4 Rapid Menu Clicking

**File:** `e2e/pages/vicav/menu/rapid-clicking.spec.ts`

**Steps:**

1. Navigate to homepage
2. Rapidly click through different menu categories
3. Verify no JavaScript errors occur
   - expect: Application remains stable without crashes

#### 2.7.5 Menu Works After Page Refresh

**File:** `e2e/pages/vicav/menu/refresh.spec.ts`

**Steps:**

1. Navigate to homepage
2. Interact with menus (open dropdowns, select items)
3. Refresh the page
4. Verify menus still work correctly
   - expect: Menu functionality is restored after refresh

#### 2.7.6 Long Menu Item Names

**File:** `e2e/pages/vicav/menu/long-items.spec.ts`

**Steps:**

1. Navigate to homepage
2. Open "Tools & Technology" menu
3. Verify "Textbook Syrian Arabic (Sound files)" and similar long items display correctly
   - expect: Long item names are fully visible without truncation issues

---

### 2.8 Accessibility Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.8.1 Desktop menu has proper ARIA attributes

**File:** `e2e/pages/vicav/menu/desktop-menu-accessibility.spec.ts`

**Steps:**

1. Navigate to homepage at 1280x720
   - expect: Page should load with desktop menu visible
2. Check accessibility tree for proper ARIA roles
   - expect: Menu should have proper role attributes (role="menubar")
   - expect: Menu items should have role="menuitem"
   - expect: Menu triggers should be focusable
3. Verify accessible names for menu components
   - expect: Menu should have aria-label or proper labeling

#### 2.8.2 Mobile menu has proper ARIA attributes

**File:** `e2e/pages/vicav/menu/mobile-menu-accessibility.spec.ts`

**Steps:**

1. Navigate to homepage at 375x667
   - expect: Page should load with mobile menu visible
2. Open mobile menu and check accessibility tree
   - expect: Mobile menu sheet should have proper ARIA attributes
   - expect: Sheet should have aria-label="Toggle menu" on trigger
   - expect: Sheet content should have proper title (role="dialog" with aria-labelledby)
3. Verify semantic HTML for expandable sections
   - expect: Menu categories in mobile menu should be properly structured

---

### 2.9 Menu Separators Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.9.1 Desktop menu renders separators correctly

**File:** `e2e/pages/vicav/menu/desktop-menu-separators.spec.ts`

**Steps:**

1. Navigate to homepage at 1280x720
   - expect: Page should load with desktop menu visible
2. Open a menu dropdown that contains separators and verify they render correctly
   - expect: Menu items with type='separator' should render as visual separators
   - expect: Separators should have role='separator' for accessibility

#### 2.9.2 Mobile menu renders separators correctly

**File:** `e2e/pages/vicav/menu/mobile-menu-separators.spec.ts`

**Steps:**

1. Navigate to homepage at 375x667
   - expect: Page should load with mobile menu visible
2. Open mobile menu and expand a category with separators
   - expect: Menu items with type='separator' should render as visual separators
   - expect: Separators should be visible as horizontal lines between menu items

---

### 2.10 Windows Integration Tests

**Seed:** `e2e/seed.spec.ts`

#### 2.10.1 Windows dropdown shows open windows

**File:** `e2e/pages/vicav/menu/windows-integration.spec.ts`

**Steps:**

1. Navigate to homepage at 1280x720
   - expect: Page should load with desktop menu visible
2. Click on Windows dropdown in menubar
   - expect: Windows dropdown should show initial windows (Mission, News, All Bibl. Locations on
     Map)
3. Open a menu item to create a window, then verify it appears in Windows dropdown
   - expect: Windows dropdown should list all open windows with their titles
   - expect: Clicking on a window in the dropdown should focus/restore that window

#### 2.10.2 Window arrangement options in desktop menu

**File:** `e2e/pages/vicav/menu/window-arrangement.spec.ts`

**Steps:**

1. Navigate to homepage at 1280x720
   - expect: Page should load with desktop menu visible
2. Open Windows dropdown and scroll to arrangement section
   - expect: Windows dropdown should show arrangement options
3. Click on different arrangement options and verify UI updates
   - expect: Selecting an arrangement should apply window layout
   - expect: Check icon should appear next to selected arrangement

---

## 3. Test Execution Matrix

| Test ID          | Test Case                      | Priority | Browser | Viewport |
| ---------------- | ------------------------------ | -------- | ------- | -------- |
| DESKTOP-MENU-001 | All Menu Categories Visible    | Critical | All     | Desktop  |
| DESKTOP-MENU-002 | Project Menu Dropdown          | Critical | All     | Desktop  |
| DESKTOP-MENU-003 | Bibliographies Menu Dropdown   | Critical | All     | Desktop  |
| DESKTOP-MENU-004 | Profiles Menu Dropdown         | High     | All     | Desktop  |
| DESKTOP-MENU-005 | Feature Lists Menu Dropdown    | High     | All     | Desktop  |
| DESKTOP-MENU-006 | Samples Menu Dropdown          | High     | All     | Desktop  |
| DESKTOP-MENU-007 | Texts Menu Dropdown            | Medium   | All     | Desktop  |
| DESKTOP-MENU-008 | Dictionaries Menu Dropdown     | High     | All     | Desktop  |
| DESKTOP-MENU-009 | Tools & Technology Menu        | High     | All     | Desktop  |
| DESKTOP-MENU-010 | Windows Menu                   | High     | All     | Desktop  |
| DESKTOP-MENU-011 | Menu Closes on Outside Click   | Medium   | All     | Desktop  |
| DESKTOP-MENU-012 | Single Menu Open at Time       | Medium   | All     | Desktop  |
| MOBILE-MENU-001  | Mobile Toggle Visible          | Critical | All     | Mobile   |
| MOBILE-MENU-002  | Mobile Menu Opens              | Critical | All     | Mobile   |
| MOBILE-MENU-003  | Mobile Categories Display      | Critical | All     | Mobile   |
| MOBILE-MENU-004  | Mobile Category Expansion      | High     | All     | Mobile   |
| MOBILE-MENU-005  | Mobile Menu Close Button       | High     | All     | Mobile   |
| MOBILE-MENU-006  | Mobile Menu Close on Selection | High     | All     | Mobile   |
| RESP-001         | Breakpoint Behavior            | Critical | All     | Both     |
| RESP-002         | Resize State Persistence       | Medium   | All     | Both     |
| KEYBOARD-001     | Tab Navigation                 | High     | All     | Desktop  |
| KEYBOARD-002     | Enter Key Opens Menu           | High     | All     | Desktop  |
| KEYBOARD-003     | Escape Closes Dropdown         | High     | All     | Desktop  |
| KEYBOARD-004     | Arrow Key Navigation           | Medium   | All     | Desktop  |
| INTERACT-001     | Mission Window Opens           | High     | All     | Desktop  |
| INTERACT-002     | News Window Opens              | High     | All     | Desktop  |
| INTERACT-003     | Windows Menu Selection         | Medium   | All     | Desktop  |
| INTERACT-004     | Cascade Arrangement            | Medium   | All     | Desktop  |
| INTERACT-005     | Tile Arrangement               | Medium   | All     | Desktop  |
| INTERACT-006     | Smart Tile Arrangement         | Medium   | All     | Desktop  |
| EDGE-001         | No API Errors                  | Critical | All     | Both     |
| EDGE-002         | Empty Menu Handling            | Low      | All     | Both     |
| EDGE-003         | Rapid Clicking Stability       | Medium   | All     | Desktop  |
| EDGE-004         | Page Refresh                   | Medium   | All     | Both     |
| EDGE-005         | Long Item Names                | Low      | All     | Desktop  |

---

## 4. Known Issues / Notes

1. **Console Errors:** Some 404 errors for optional CSS resources (fonts, winbox, leaflet) appear in
   console but do not affect functionality.

2. **Menu Data Source:** All menu items are dynamically fetched from an API via `useProjectInfo`
   composable - test assertions should verify presence of items rather than hardcoding expected
   values where possible.

3. **Window System:** The application uses a custom window management system (WinBox) for displaying
   content - tests should account for window open/close/focus behaviors.

4. **Responsive Breakpoint:** The menu switches from desktop to mobile at 1024px width.

5. **Initial Windows:** The homepage loads with three initial windows already open: Mission, News,
   and All Bibl. Locations on Map.

---

## 5. Test Data Requirements

- **API Base URL:** Configured via NUXT_PUBLIC_API_BASE_URL environment variable
- **Test Environment:** Uses local development server (localhost:3000)
- **Backend:** vicav (configured for https://vicav-dev.acdh.oeaw.ac.at)

---

## 6. Success Criteria

All test cases should pass, verifying:

- All menu categories and items are accessible
- Dropdown menus open and close correctly
- Mobile menu functions properly at viewport < 1024px
- Keyboard navigation works correctly
- Menu item selection triggers appropriate actions (window opening, navigation)
- No critical JavaScript errors occur during menu interactions
- Responsive behavior works correctly at breakpoints
- Accessibility requirements are met (ARIA attributes, keyboard navigation)
- Menu separators render correctly in both desktop and mobile views
- Windows integration works properly (window listing, arrangement options)
