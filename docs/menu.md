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

## Schemas (OpenAPI)

The menu and the initial windows (`panel`) are described by the OpenAPI spec
(`app/assets/openapi.json`, upstream `acdh-oeaw/vicav-app-api`):

- `GET /vicav/project` → **`ProjectConfig`** (`projectConfig` + `ETag` + `took`) →
  **`projectConfig_type`**
- `projectConfig_type.menu` → **`menu_type`**: `main: main_item_type[]`, `subnav: item_type[]`
- `projectConfig_type.panel` → **`item_type`**[] — the windows restored on first load use the **same
  item schema** as the menu items
- **`main_item_type`** — a top-level dropdown: `id`, `target`, `title`, `item: item_type[]`,
  `type: "dropdown"` (all required, `additionalProperties: false`)
- **`item_type`** — one shared item shape for `menu.main[].item[]`, `menu.subnav[]` and `panel[]`:
  `type: "panel" | "item" | "separator" | "dropdown"` (the only required key) plus `id` / `target` /
  `title` / `targetType` / `label` / `class` / `params` linked by `dependentRequired`; `params` is
  `oneOf [geo_target_type_parameters, text_target_type_parameters]`

The generated TypeScript equivalents are `MenuType`, `MainItemType`, `ItemType`, `ProjectConfigType`
in `app/lib/api-client/index.ts` (regenerated from the spec on install/build).

> [!NOTE] `item_type.params`' `oneOf` has known gaps against live data (a `BiblioEntries` item with
> only `queryString` matches no branch; a tunocent `WMap` item carrying both geo and text params
> matches both branches — both fail the exclusive `oneOf`). See
> [docs/openapi-spec-change-requests.md](./openapi-spec-change-requests.md) (CR-1).

## Menu Item Types

The hand-written shape below summarizes what the components consume. The authoritative definitions
are the OpenAPI schemas `main_item_type` / `item_type` (see "Schemas (OpenAPI)"), which carry
additionally `target`, `label`, `class` and a typed `params`.

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
