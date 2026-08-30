# TUNOCENT Test Plan

This plan was generated using AI (MiniMax-m2.5) and _kilocode_ using the prompt

> Using @playwright-test-planner inspect http://127.0.0.1:3000 and create a third test plan
> `specs/tunocent-menu-test-plan.md`.

## Overview

This document outlines a comprehensive test plan for the TUNOCENT application - a linguistic
research database for Tunisia's Arabic varieties. The application provides access to speaker
profiles, linguistic feature lists, sample texts, and corpus texts with geographic visualization
capabilities.

**Application URL**: http://127.0.0.1:3000 **Backend API**: https://tunocent-api.acdh-dev.oeaw.ac.at
**Application Type**: Web-based linguistic research database with windowed interface

---

## Test Objectives

1. **Verify Core Functionality**: Ensure all navigation menus and submenu options work correctly
2. **Validate Data Display**: Confirm data tables and content render correctly for all sections
3. **Test Search & Filter**: Validate search interfaces return accurate results
4. **Verify Map Integration**: Ensure geographic visualizations display correctly
5. **Validate Responsive Design**: Test both desktop and mobile layouts
6. **Verify Imprint Page**: Confirm legal information page loads correctly
7. **Error Handling**: Test edge cases and invalid inputs

---

## Test Scope

### In Scope

- Homepage and navigation menu functionality
- All seven main menu sections (About, Profiles, Feature Lists, Sample Texts, Corpus Texts, Browse
  data, Research)
- Submenu options and window opening behavior
- Data table rendering and content display
- Search and filter forms
- Map visualization functionality
- Window management (Cascade, Tile, Smart tile, etc.)
- Footer and imprint page
- Mobile responsive behavior

### Out of Scope

- Backend API performance testing
- Database integrity (assumed handled by API tests)
- Browser-specific rendering bugs outside Chromium/Firefox/WebKit
- Third-party service uptime (MapLibre, Matomo analytics)

---

## Test Data Requirements

### Environment Variables

```bash
export NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at"
```

### Expected Data Counts (for validation)

| Data Type     | Expected Count | Description                      |
| ------------- | -------------- | -------------------------------- |
| Profiles      | 71             | Geography, history, demographics |
| Feature Lists | 195            | Grammatical/lexical variation    |
| Sample Texts  | 185            | 7 sentences each                 |
| Corpus Texts  | 24             | Transcribed narratives           |
| Browse Data   | 2,683          | Speakers, locations, data types  |

### Test Accounts

- No authentication required (public application)

---

## Priority Ordering

### Priority 1 - Critical (Happy Path)

1. **Homepage Load**
   - Verify page loads without errors
   - Confirm correct document title
   - Verify all main navigation elements visible

2. **Navigation - Menu Access**
   - Test all 7 main menu items clickable
   - Verify submenu options appear on hover/click
   - Confirm windows open with correct content

3. **Data Display - Basic**
   - Verify Welcome window displays on load
   - Confirm statistics shown correctly

4. **Imprint Page**
   - Navigate to /imprint
   - Verify page loads correctly

### Priority 2 - High (Core Functionality)

5. **Profiles Section**
   - List all entries loads
   - Map view displays markers

6. **Feature Lists Section**
   - List all feature lists loads
   - Map view displays markers
   - Search interface accessible

7. **Sample Texts Section**
   - List all sample texts loads
   - Map view displays markers
   - Search interface accessible

8. **Corpus Texts Section**
   - List all entries loads
   - Search functionality works

9. **Browse Data Section**
   - List all recordings loads
   - Map view shows locations

### Priority 3 - Medium (Extended Features)

10. **Research Section**
    - Publications list loads
    - Presentations list loads
    - Conference content accessible

11. **Window Management**
    - Cascade windows
    - Tile windows
    - Smart tile arrangement
    - Close/minimize/maximize

12. **Search Validation**
    - Feature list search returns results
    - Sample text search returns results
    - Corpus search returns results

### Priority 4 - Low (Edge Cases & Mobile)

13. **Mobile Responsive**
    - Hamburger menu works
    - Layout adapts correctly

14. **Error Handling**
    - Invalid search inputs handled gracefully
    - Network timeout handling

15. **Accessibility**
    - Skip links work
    - Keyboard navigation functional

---

## Test Scenarios

### Suite 1: Homepage & Navigation

#### TC-001: Homepage Load

- **Steps**:
  1. Navigate to http://127.0.0.1:3000
  2. Wait for page load
- **Expected**: Page loads with title "Home | TUNOCENT - Tunisia's Linguistic terra incognita"

#### TC-002: Main Navigation Visible

- **Steps**:
  1. Load homepage
  2. Check for header navigation elements
- **Expected**: All 7 menu items visible (About, Profiles, Feature Lists, Sample Texts, Corpus
  Texts, Browse data, Research)

#### TC-003: Navigation Menu Click

- **Steps**:
  1. Click on "Profiles" button (main nav uses `getByRole("button")`)
  2. Verify dropdown submenu appears
  3. Press ArrowDown + Enter to select "List all entries"
- **Expected**: Window opens with profiles table

#### TC-004: Windows Menu Functionality

- **Steps**:
  1. Click on "Windows" menu item
  2. Verify submenu shows open windows and arrangement options
- **Expected**: Menu shows "Welcome to TUNOCENT" and arrangement options (None, Cascade, Tile, Smart
  tile, Column 5 Flex)

---

### Suite 2: Data Sections

#### TC-005: Profiles - List All Entries

- **Steps**:
  1. Hover on "Profiles" button
  2. Click "List all entries"
- **Expected**: Window opens with `<ul>` list content

#### TC-006: Profiles - Show on Map

- **Steps**:
  1. Hover on "Profiles" button
  2. Click "Show profiles on map"
  3. Window opens with `[data-geo-map]` element visible
- **Expected**: Map displays with approximately 72 markers

#### TC-007: Feature Lists - List All

- **Steps**:
  1. Hover on "Feature Lists" button
  2. Click "List all feature lists"
- **Expected**: Window opens with `<ul>` list content

#### TC-008: Feature Lists - Show on Map

- **Steps**:
  1. Hover on "Feature Lists" button
  2. Click "Show feature lists on map"
  3. Window opens with `[data-geo-map]` element visible
- **Expected**: Map displays with 196 markers

#### TC-009: Feature Lists - Search Interface

- **Steps**:
  1. Hover on "Feature Lists" button
  2. Click "Search and compare feature lists"
- **Expected**: Search form with labels: Place, Speaker identifier, Age, Sex, Word, Features,
  Translation, Comment + Query button

#### TC-010: Sample Texts - List All

- **Steps**:
  1. Hover on "Sample Texts" button
  2. Click "List all sample texts"
- **Expected**: Window opens with `<ul>` list content

#### TC-011: Sample Texts - Show on Map

- **Steps**:
  1. Hover on "Sample Texts" button
  2. Click "Show sample texts on map"
  3. Window opens with `[data-geo-map]` element visible
- **Expected**: Map displays with markers

#### TC-012: Sample Texts - Search Interface

- **Steps**:
  1. Hover on "Sample Texts" button
  2. Click "Search and compare sample texts"
- **Expected**: Search form with labels: Place, Speaker identifier, Age, Sex, Word, Sentences,
  Comment + Query button

#### TC-013: Corpus Texts - List All

- **Steps**:
  1. Hover on "Corpus Texts" button
  2. Click "List all transcribed entries"
- **Expected**: Window opens with `<ul>` list content

#### TC-014: Corpus Texts - Search

- **Steps**:
  1. Hover on "Corpus Texts" button
  2. Click "Search the corpus"
- **Expected**: Search form with text input and "Search for words or enter a CQL query" text

#### TC-015: Browse Data - List All

- **Steps**:
  1. Hover on "Browse data" button
  2. Click "List all data recordings"
- **Expected**: Window opens with `<table>` or `<ul>` content

#### TC-016: Browse Data - Show Locations

- **Steps**:
  1. Hover on "Browse data" button
  2. Click "Show all locations"
  3. Window opens with `[data-geo-map]` element visible
- **Expected**: Map displays recording locations

---

### Suite 3: Research Section

#### TC-017: Research - Publications

- **Steps**:
  1. Navigate to homepage
  2. Click Research > Publications
- **Expected**: Publications list window opens

#### TC-018: Research - Presentations

- **Steps**:
  1. Navigate to homepage
  2. Click Research > Presentations
- **Expected**: Presentations list window opens

#### TC-019: Research - Conference

- **Steps**:
  1. Navigate to homepage
  2. Click Research > Conference
- **Expected**: Conference information window opens

---

### Suite 4: Window Management

#### TC-020: Window Arrangement - Cascade

- **Steps**:
  1. Open multiple windows
  2. Click Windows > Cascade
- **Expected**: Windows arranged in overlapping cascade pattern

#### TC-021: Window Arrangement - Tile

- **Steps**:
  1. Open multiple windows
  2. Click Windows > Tile
- **Expected**: Windows arranged in non-overlapping tile grid

#### TC-022: Window Arrangement - Smart Tile

- **Steps**:
  1. Open multiple windows
  2. Click Windows > Smart tile
- **Expected**: Windows arranged in optimized smart grid

#### TC-023: Window Close

- **Steps**:
  1. Open a window
  2. Click window close button
- **Expected**: Window closes

---

### Suite 5: Imprint & Footer

#### TC-024: Imprint Page Navigation

- **Steps**:
  1. Click on "Imprint" link in footer
- **Expected**: Navigate to /imprint page

#### TC-025: Imprint Page Content

- **Steps**:
  1. Navigate to /imprint
  2. Verify content sections
- **Expected**: All legal sections visible (Media Owner, Purpose, Copyright, Data Privacy)

#### TC-026: Footer Links

- **Steps**:
  1. Hover over footer "CONTACT" area
  2. Click on "ASK US!" link
- **Expected**: Email client opens with mailto:acdh-helpdesk@oeaw.ac.at

#### TC-027: Footer DOI Link

- **Steps**:
  1. Locate DOI link in footer
  2. Click on funding DOI
- **Expected**: Navigates to https://doi.org/10.55776/P31647

---

### Suite 6: Search Functionality

#### TC-028: Feature List Search - Basic

- **Steps**:
  1. Navigate to Feature Lists > Search and compare feature lists
  2. Enter search term in "Word" field
  3. Click "Query" button
- **Expected**: Search results displayed in table format

#### TC-029: Sample Text Search - Basic

- **Steps**:
  1. Navigate to Sample Texts > Search and compare sample texts
  2. Enter search term
  3. Click "Query" button
- **Expected**: Search results displayed

#### TC-030: Corpus Search - Exact Match

- **Steps**:
  1. Navigate to Corpus Texts > Search the corpus
  2. Enter word in "Search for exact words"
  3. Click "Query" button
- **Expected**: Results displayed with matched context

#### TC-031: Corpus Search - CQL Advanced

- **Steps**:
  1. Navigate to Corpus Texts > Search the corpus
  2. Enter CQL query in advanced search
  3. Click "Query" button
- **Expected**: CQL search results displayed

---

### Suite 7: Mobile Responsive

#### TC-032: Mobile Hamburger Menu

- **Steps**:
  1. Resize viewport to mobile dimensions (< 768px)
  2. Click hamburger menu toggle
- **Expected**: Mobile menu opens with navigation options

#### TC-033: Mobile Navigation

- **Steps**:
  1. Open mobile menu
  2. Click menu item
- **Expected**: Submenu appears with options

---

### Suite 8: Error Handling & Edge Cases

#### TC-034: Empty Search Results

- **Steps**:
  1. Navigate to search interface
  2. Enter unlikely search term (e.g., "xyzqwerty123")
  3. Submit search
- **Expected**: Empty results message displayed (not error)

#### TC-035: Network Timeout

- **Steps**:
  1. Throttle network to slow 3G
  2. Navigate to data section
- **Expected**: Loading indicator shown, then content or error message

#### TC-036: Invalid URL

- **Steps**:
  1. Navigate to http://127.0.0.1:3000/invalid-page-12345
- **Expected**: Appropriate error or redirect

---

## Dependencies & Prerequisites

### Environment Requirements

1. **Node.js**: v18+ (for local development)
2. **pnpm**: Package manager
3. **Playwright**: Installed for e2e testing
4. **Backend API**: Must be online (https://tunocent-api.acdh-dev.oeaw.ac.at)

### Starting the Application

```bash
# Development mode
pnpm run dev

# Or for testing
pnpm run start:local
```

### Running Tests

```bash
# Run all tests
NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test

# Run specific test file
NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test e2e/pages/tunocent/index.spec.ts

# Run with UI
NUXT_PUBLIC_API_BASE_URL="https://tunocent-api.acdh-dev.oeaw.ac.at" pnpm exec playwright test --ui
```

---

## Test File Structure

Recommended test organization:

```
e2e/
└── pages/
    └── tunocent/
        ├── home.spec.ts          # Homepage tests
        ├── imprint.spec.ts     # Imprint page tests
        ├── profiles.spec.ts   # Profiles section tests
        ├── feature-lists.spec.ts  # Feature lists tests
        ├── sample-texts.spec.ts    # Sample texts tests
        ├── corpus-texts.spec.ts  # Corpus texts tests
        ├── browse-data.spec.ts   # Browse data tests
        ├── research.spec.ts    # Research section tests
        ├── search.spec.ts    # Search functionality tests
        └── mobile.spec.ts    # Mobile responsive tests
```

---

## Menu Technical Details

## See `../docs/menu.md`

## Notes

1. **Window Timing**: Some windows may take time to load data from API - appropriate waits may be
   needed
2. **Map Rendering**: Map snapshots may need visual verification beyond assertions
3. **Data Counts**: Actual counts may vary - tests should use >= or <= assertions where appropriate
4. **Menu Behavior**: Always use `getByRole("button", ...)` for main nav,
   `getByRole("menuitem", ...)` for Windows dropdown
5. **Search Autocomplete**: TagsSelect components may need typing delays for dropdown population
