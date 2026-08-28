# Playwright test plan for shawi-menu

**Session ID:** ses_287a6036dffe4DMx6WPB258d42 **Created:** 10.4.2026, 19:04:16 **Updated:**
10.4.2026, 19:33:47

---

## User

Using @playwright-test-planner inspect http://127.0.0.1:3000 and create a second test plan
`specs/shawi-menu-test-plan.md`.

---

## Assistant (Build · MiniMax-M2.5 · 269.5s)

**Tool: task**

**Input:**

```json
{
	"command": "/inspect http://127.0.0.1:3000",
	"description": "Inspect local server for test plan",
	"prompt": "Use playwright-test-planner to inspect http://127.0.0.1:3000 and create a comprehensive test plan. Return the complete test plan content that should be written to specs/shawi-menu-test-plan.md.",
	"subagent_type": "playwright-test-planner"
}
```

**Output:**

```
task_id: ses_2878f1e83ffedy0nMM163mj3aZ (for resuming to continue this task if needed)

<task_result>


The test plan has been successfully created and saved to `specs/shawi-menu-test-plan.md`.

## Summary

I've inspected the SHAWI application running at http://127.0.0.1:3000 and created a comprehensive test plan covering:

### Test Plan Overview

The test plan includes **10 test suites** with **42 test scenarios**:

1. **Home Page** (3 tests) - Document title, main heading, skip link
2. **Menu Bar - Desktop** (9 tests) - All menu items, About/Profiles/Corpus/Glossary/Windows content, single menu open behavior, menu closing, separators
3. **Window Management** (9 tests) - Arrangement options, opening windows (News, About, Team), arrangement modes (Tile, Cascade, Smart Tile), multiple windows, URL state
4. **Keyboard Navigation** (4 tests) - Tab navigation, arrow keys, Enter key, Escape key
5. **Footer** (4 tests) - Basic elements, Imprint link, ACDH-CH link, extended footer
6. **Imprint Page** (3 tests) - Title, legal content, navigation back
7. **Accessibility** (3 tests) - ARIA roles, keyboard accessibility, skip link
8. **Edge Cases and Error Handling** (3 tests) - API errors, loading states, no windows open
9. **Responsive Behavior** (2 tests) - Desktop display, different viewport sizes
10. **Project News and Mission** (3 tests) - News, About, Team window content

### Key Application Features Discovered

- **5 main menu items**: About, Profiles, Corpus, Glossary, Windows
- **Windows arrangement modes**: None, Cascade, Tile, Smart tile, Column 5 Flex
- **Footer**: Shows version info (Frontend, Backend, Data), Imprint link, ACDH-CH link
- **Pages**: Home page and Imprint page
- **Accessibility**: Skip to main content link, ARIA menu roles

The test plan follows the existing project patterns (similar to vicav tests) and is ready for test implementation.
</task_result>
```

---

## Assistant (Build · MiniMax-M2.5 · 2.7s)

The test plan has been created at `specs/shawi-menu-test-plan.md` with 10 test suites covering 42
test scenarios, including:

- Home page and navigation
- Menu bar (desktop)
- Window management (arrangement modes)
- Keyboard navigation
- Footer and imprint page
- Accessibility features
- Responsive behavior

---
