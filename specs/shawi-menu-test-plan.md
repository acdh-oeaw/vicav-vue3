# SHAWI Menu Test Plan

This plan was generated using AI (MiniMax-m2.5) and opencode using the prompt

> Using @playwright-test-planner inspect http://127.0.0.1:3000 and create a second test plan
> `specs/shawi-menu-test-plan.md`.

It was slightly edited after generation.

## Application Overview

Comprehensive test plan for SHAWI (SHAWI - Shared Arabic World Information) application menu system.
SHAWI is a web-based corpus interface for Arabic varieties managed by ACDH. This test plan covers
all menu functionality, window management, navigation, and user interactions.

## Test Scenarios

### 1. Home Page

**Seed:** `e2e/seed.spec.ts`

#### 1.1. Home Page - Document Title

**File:** `e2e/pages/shawi/index.test.ts`

**Steps:**

1. Navigate to http://127.0.0.1:3000/ and wait for page load
   - expect: Page should have title 'Home | SHAWI'

**Status:** Implemented

#### 1.2. Home Page - Initial Windows

**File:** `e2e/pages/shawi/index.test.ts`

**Steps:**

1. Navigate to http://127.0.0.1:3000/ and wait for page load
   - expect: Initial windows should be visible

**Status:** Not yet implemented (test is skipped)

#### 1.3. Home Page - Window Menu

**File:** `e2e/pages/shawi/index.test.ts`

**Steps:**

1. Navigate to http://127.0.0.1:3000/ and verify window menu
   - expect: Window menu should have appropriate entries

**Status:** Not yet implemented (test is skipped)

#### 1.4. Home Page - Footer Bar with Imprint Link

**File:** `e2e/pages/shawi/index.test.ts`

**Steps:**

1. Navigate to http://127.0.0.1:3000/
2. Verify Imprint link is visible in footer
   - expect: Imprint link should be visible in footer

**Status:** Implemented

#### 1.5. Home Page - Extended Footer on Hover

**File:** `e2e/pages/shawi/index.test.ts`

**Steps:**

1. Navigate to http://127.0.0.1:3000/
2. Hover over footer area
3. Verify CONTACT section becomes visible
   - expect: Extended footer with CONTACT should be visible on hover

**Status:** Implemented

### 2. Menu Bar - Desktop

**Seed:** `e2e/seed.spec.ts`

#### 2.1. Desktop Menu - All Menu Items Visible

**File:** `e2e/pages/shawi/menu/desktop-menu-rendering.test.ts`

**Steps:**

1. Navigate to home page and verify menu bar contains About, Profiles, Corpus, Glossary, Windows
   menu items
   - expect: All five menu items should be visible: About, Profiles, Corpus, Glossary, Windows

#### 2.2. Desktop Menu - About Menu Content

**File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`

**Steps:**

1. Click on About menu item and verify submenu items
   - expect: About menu should contain: About, Team, News

#### 2.3. Desktop Menu - Profiles Menu Content

**File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`

**Steps:**

1. Click on Profiles menu item and verify submenu items
   - expect: Profiles menu should contain: Explanation, Show All Locations, List all entries,
     Contribute a Profile

#### 2.4. Desktop Menu - Corpus Menu Content

**File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`

**Steps:**

1. Click on Corpus menu item and verify submenu items
   - expect: Corpus menu should contain: List all entries, Search the corpus, Functional
     Requirements and Data Specification

#### 2.5. Desktop Menu - Glossary Menu Content

**File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`

**Steps:**

1. Click on Glossary menu item and verify submenu items
   - expect: Glossary menu should contain: Search for vocabulary in corpus texts, Functional
     Requirements and Data Specification

#### 2.6. Desktop Menu - Windows Menu Content

**File:** `e2e/pages/shawi/menu/desktop-all-categories.test.ts`

**Steps:**

1. Click on Windows menu item and verify submenu items
   - expect: Windows menu should contain: No windows open, Arrangement section with None, Cascade,
     Tile, Smart tile, Column 5 Flex

#### 2.7. Desktop Menu - Single Menu Open Behavior

**File:** `e2e/pages/shawi/menu/single-menu-open.test.ts`

**Steps:**

1. Click on About menu to open it
2. Move the mouse over to the Profiles menu
3. Verify About menu is closed and Profiles menu is open
   - expect: Only one dropdown menu should be open at a time when clicking different menu items
4. Click on the Profiles menu
5. Verify that About menu and Profiles menu are closed
   - expect: Neither dropdown is visible

#### 2.8. Desktop Menu - Close Menu When Clicking Outside

**File:** `e2e/pages/shawi/menu/menu-close-outside.test.ts`

**Steps:**

1. 1. Open any menu (e.g., About)
2. Click on the main content area
3. Verify the menu is closed
   - expect: Menu should close when clicking on main content area outside the menu

#### 2.9. Desktop Menu - Separator Lines Present

**File:** `e2e/pages/shawi/menu/desktop-menu-separators.test.ts`

**Steps:**

1. Open Windows menu and verify separator between 'No windows open' and 'Arrangement' sections
   - expect: Separator lines should be visible between menu sections where applicable

### 3. Window Management

**Seed:** `e2e/seed.spec.ts`

#### 3.1. Windows Menu - Arrangement Options Display

**File:** `e2e/pages/shawi/windows/windows-dropdown.test.ts`

**Steps:**

1. Open Windows menu and verify None, Cascade, Tile, Smart tile, Column 5 Flex options are present
   - expect: All window arrangement options should be visible and selectable

#### 3.2. Windows Menu - Open News Window

**File:** `e2e/pages/shawi/windows/windows-selection.test.ts`

**Steps:**

1. 1. Open About menu
2. Click on News menu item
3. Verify News window opens with appropriate content
   - expect: Clicking on News should open a window with News content

#### 3.3. Windows Menu - Open About Window

**File:** `e2e/pages/shawi/windows/windows-selection.test.ts`

**Steps:**

1. 1. Open About menu
2. Click on About menu item
3. Verify About window opens
   - expect: Clicking on About should open About content in a window

#### 3.4. Windows Menu - Open Team Window

**File:** `e2e/pages/shawi/windows/windows-selection.test.ts`

**Steps:**

1. 1. Open About menu
2. Click on Team menu item
3. Verify Team window opens
   - expect: Clicking on Team should open Team content in a window

#### 3.5. Windows Arrangement - Tile Mode

**File:** `e2e/pages/shawi/windows/windows-arrangement-tile.test.ts`

**Steps:**

1. 1. Open two windows (e.g., About and News)
2. Open Windows menu
3. Select Tile arrangement
4. Verify windows are arranged in tile layout
   - expect: Windows should arrange in tile layout when Tile option is selected

#### 3.6. Windows Arrangement - Cascade Mode

**File:** `e2e/pages/shawi/windows/windows-arrangement-cascade.test.ts`

**Steps:**

1. 1. Open two windows
2. Open Windows menu
3. Select Cascade arrangement
4. Verify windows are arranged in cascade layout
   - expect: Windows should arrange in cascade layout when Cascade option is selected

#### 3.7. Windows Arrangement - Smart Tile Mode

**File:** `e2e/pages/shawi/windows/windows-arrangement-smart-tile.test.ts`

**Steps:**

1. 1. Open multiple windows
2. Open Windows menu
3. Select Smart tile arrangement
4. Verify windows are arranged in smart tile layout
   - expect: Windows should arrange in smart tile layout when Smart tile option is selected

#### 3.8. Windows - Multiple Windows Open

**File:** `e2e/pages/shawi/windows/windows-integration.test.ts`

**Steps:**

1. 1. Open About window
2. Open News window
3. Verify both windows are visible and content loads correctly
   - expect: Multiple windows can be open simultaneously and display correctly

#### 3.9. Windows - URL Updates with Window State

**File:** `e2e/pages/shawi/windows/windows-integration.test.ts`

**Steps:**

1. 1. Note initial URL
2. Open a window (e.g., News)
3. Verify URL contains window parameter (w=)
   - expect: URL should update with window parameters when windows are opened

### 4. Keyboard Navigation

**Seed:** `e2e/seed.spec.ts`

#### 4.1. Keyboard - Tab Navigation Through Menu

**File:** `e2e/pages/shawi/keyboard/keyboard-tab-navigation.test.ts`

**Steps:**

1. 1. Press Tab key multiple times
2. Verify focus moves through menu items in the menubar
   - expect: Tab key should navigate through menu items in logical order

#### 4.2. Keyboard - Arrow Key Navigation Within Menu

**File:** `e2e/pages/shawi/keyboard/keyboard-arrow-navigation.test.ts`

**Steps:**

1. 1. Open a menu (e.g., About)
2. Use arrow keys to navigate through menu items
3. Verify focus moves correctly
   - expect: Arrow keys should navigate between menu items within an open dropdown

#### 4.3. Keyboard - Enter Key to Select Menu Item

**File:** `e2e/pages/shawi/keyboard/keyboard-enter.test.ts`

**Steps:**

1. 1. Navigate to a menu item using keyboard
2. Press Enter
3. Verify the corresponding action is performed
   - expect: Enter key should select the focused menu item and open corresponding window

#### 4.4. Keyboard - Escape Key to Close Menu

**File:** `e2e/pages/shawi/keyboard/keyboard-escape.test.ts`

**Steps:**

1. 1. Open a menu
2. Press Escape key
3. Verify menu is closed
   - expect: Escape key should close the open dropdown menu

### 5. Footer

**Seed:** `e2e/seed.spec.ts`

#### 5.1. Footer - Basic Elements Present

**File:** `e2e/pages/shawi/footer/footer-basic.test.ts`

**Steps:**

1. Navigate to home page and verify footer contains: © 2026, ACDH link, Imprint link, Frontend
   version, Backend version, Data version
   - expect: Footer should display copyright, ACDH link, Imprint link, and version info

#### 5.2. Footer - Imprint Link Functionality

**File:** `e2e/pages/shawi/footer/footer-imprint-link.test.ts`

**Steps:**

1. 1. Click on Imprint link in footer
2. Verify URL changes to /imprint
3. Verify page title is 'Imprint | SHAWI'
   - expect: Clicking Imprint link should navigate to /imprint page

#### 5.3. Footer - ACDH Link Functionality

**File:** `e2e/pages/shawi/footer/footer-acdh-link.test.ts`

**Steps:**

1. 1. Click on ACDH link in footer
2. Verify link href points to https://www.oeaw.ac.at/acdh
   - expect: Clicking ACDH link should navigate to https://www.oeaw.ac.at/acdh

#### 5.4. Footer - Extended Footer on Hover

**File:** `e2e/pages/shawi/footer/footer-extended.test.ts`

**Steps:**

1. 1. Hover over the footer area
2. Verify extended footer becomes visible with CONTACT section
3. Verify ACDH address and contact details are shown
   - expect: Hovering over footer should reveal extended contact information

### 6. Imprint Page

**Seed:** `e2e/seed.spec.ts`

#### 6.1. Imprint Page - Document Title

**File:** `e2e/pages/shawi/imprint/imprint-page.test.ts`

**Steps:**

1. Navigate to /imprint and verify page title
   - expect: Page title should be 'Imprint | SHAWI'

#### 6.2. Imprint Page - Legal Content Present

**File:** `e2e/pages/shawi/imprint/imprint-page.test.ts`

**Steps:**

1. Navigate to /imprint and verify main content contains 'Legal disclosure' text
   - expect: Imprint page should contain legal disclosure text

#### 6.3. Imprint Page - Navigate Back Functionality

**File:** `e2e/pages/shawi/imprint/imprint-page.test.ts`

**Steps:**

1. 1. Navigate to /imprint
2. Click on 'Navigate Back' or shawi logo
3. Verify return to home page
   - expect: Should be able to navigate back to home from imprint page

### 7. Accessibility

**Seed:** `e2e/seed.spec.ts`

#### 7.1. Accessibility - Menu ARIA Roles

**File:** `e2e/pages/shawi/accessibility/menu-aria-attributes.test.ts`

**Steps:**

1. 1. Open a menu
2. Verify menubar has role='menubar'
3. Verify menuitems have role='menuitem'
   - expect: Menu should have proper ARIA roles and attributes for screen readers

#### 7.2. Accessibility - Keyboard Accessibility

**File:** `e2e/pages/shawi/accessibility/menu-keyboard-accessibility.test.ts`

**Steps:**

1. 1. Verify all interactive elements are focusable
2. Verify menu can be opened, navigated, and items selected using only keyboard
   - expect: All menu functions should be accessible via keyboard only

#### 7.3. Accessibility - Skip to Main Content Link

**File:** `e2e/pages/shawi/accessibility/skip-link.test.ts`

**Steps:**

1. 1. Press Tab key on page load
2. Verify first focusable element is 'Skip to main content' link
   - expect: Skip to main content link should be first focusable element

### 8. Edge Cases and Error Handling

**Seed:** `e2e/seed.spec.ts`

#### 8.1. Error Handling - API Error Display

**File:** `e2e/pages/shawi/error/api-error-handling.test.ts`

**Steps:**

1. Test application behavior when backend API returns errors (verify console for errors)
   - expect: Application should display appropriate error messages when API fails

#### 8.2. Loading State - Menu Loading

**File:** `e2e/pages/shawi/error/loading-state.test.ts`

**Steps:**

1. Verify menu items appear only after data is loaded
   - expect: Menu should show loading state while fetching menu data

#### 8.3. Edge Case - No Windows Open State

**File:** `e2e/pages/shawi/error/empty-menu.test.ts`

**Steps:**

1. Open Windows menu on fresh page load and verify 'No windows open' message
   - expect: Windows menu should show 'No windows open' when no windows are open

### 9. Responsive Behavior

**Seed:** `e2e/seed.spec.ts`

#### 9.1. Responsive - Desktop Menu Display

**File:** `e2e/pages/shawi/responsive/desktop-view.test.ts`

**Steps:**

1. Set viewport to 1280x720 and verify menu displays horizontally
   - expect: Menu should display horizontally on desktop (1280px+)

#### 9.2. Responsive - Menu Behavior at Different Sizes

**File:** `e2e/pages/shawi/responsive/responsive-breakpoint.test.ts`

**Steps:**

1. Test menu at various viewport sizes: 1920px, 1280px, 1024px, 768px
   - expect: Menu should adapt appropriately at different viewport sizes

### 10. Project News and Mission

**Seed:** `e2e/seed.spec.ts`

#### 10.1. Project - News Window Content

**File:** `e2e/pages/shawi/project/project-news.test.ts`

**Steps:**

1. Open About > News window and verify content includes date and news entries
   - expect: News window should display project news content

#### 10.2. Project - About Window Content

**File:** `e2e/pages/shawi/project/project-mission.test.ts`

**Steps:**

1. Open About > About window and verify content is displayed
   - expect: About window should display project information

#### 10.3. Project - Team Window Content

**File:** `e2e/pages/shawi/project/project-team.test.ts`

**Steps:**

1. Open About > Team window and verify content is displayed
   - expect: Team window should display team information
