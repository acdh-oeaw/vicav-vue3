# Menu System

## Overview

The main navigation menu is dynamically loaded from the backend API based on project configuration.
Menu items are rendered differently depending on viewport size.

## Components

| Component               | File                                            | Description                       |
| ----------------------- | ----------------------------------------------- | --------------------------------- |
| AppHeader               | `app/components/app-header.vue`                 | Container, loads menu config      |
| AppNavigationMenu       | `app/components/app-navigation-menu.vue`        | Desktop menu (lg breakpoint+)     |
| AppNavigationMobileMenu | `app/components/app-navigation-mobile-menu.vue` | Mobile menu (hidden on lg+)       |
| WindowListDropdown      | `app/components/window-list-dropdown.vue`       | Windows dropdown (always visible) |

## Menu Data Flow

1. `AppHeader` fetches menu config via `useProjectInfo()` → `data.value.projectConfig.menu.main`
2. Config is passed to `AppNavigationMenu` as `menus` prop
3. User clicks trigger `onSelectMenuItem()` which creates a window via `addWindow()`

## Menu Item Types

```ts
type MainItemType = {
	id: string;
	title: string; // Display text (e.g., "Profiles", "Feature Lists")
	item: Array<{
		id: string;
		type: "item" | "separator";
		title?: string; // For type="item"
		targetType: string; // Window type (e.g., "Profile", "DataTable")
		params?: object; // Window parameters
	}>;
};
```

## Test Selectors

**Desktop menu items are `<button>` elements**, not `<menuitem>`. Use:

```ts
// Correct for desktop
await page.getByRole("button", { name: "Profiles" }).click();

// Windows dropdown uses menuitem
await page.getByRole("menuitem", { name: "Windows" }).click();
```

The desktop menu uses Reka UI's `NavigationMenu` component, which renders trigger buttons. The
Windows dropdown is a separate `WindowListDropdown` component that uses standard menubar/menuitem
roles.

## Testing Navigation

**Revealing dropdowns**: Hover over the button, then click the menu item. Click alone doesn't reveal
the dropdown reliably.

```ts
// Hover to reveal dropdown
await page.getByRole("button", { name: "Profiles" }).hover();
await page.waitForTimeout(500);
// Click the specific menu item
await page.getByText("List all entries").click();
```

**Menu item names** (exact text; these examples are tunocent-derived — for the vicav item names, see
`specs/menu-test-plan.md` §1):

- Profiles: "List all entries", "Show profiles on map"
- Feature Lists: "List all feature lists", "Show feature lists on map", "Search and compare feature
  lists"
- Sample Texts: "List all sample texts", "Show sample texts on map", "Search and compare sample
  texts"
- Corpus Texts: "List all transcribed entries", "Search the corpus"
- Browse data: "List all data recordings", "Show all locations"

**Targeting windows**: Use `.winbox` selector. Get newest window:

```ts
async function getNewestWindow(page) {
	await page.waitForTimeout(500);
	const windows = await page.locator(".winbox").all();
	return windows[windows.length - 1];
}
```

**Content verification patterns**:

- List views: `winbox.locator("ul")`
- Map views: `winbox.locator("[data-geo-map]")`
- Search forms: `winbox.getByText("FieldName", { exact: true })` or
  `winbox.getByRole("button", { name: "Query" })`
