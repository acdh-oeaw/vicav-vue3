# Window Types

Implemented `targetType` values are taken from
[app/components/window-content.vue](../app/components/window-content.vue), and the shapes below are
taken from [app/types/global.ts](../app/types/global.ts).

## Overview

| `targetType`             | Rendered component                            | Extra props          | Events wired                          |
| ------------------------ | --------------------------------------------- | -------------------- | ------------------------------------- |
| `WMap`                   | `geo-map-window-content.vue`                  | `title`              | –                                     |
| `Text`                   | `text-window-content.vue`                     | –                    | –                                     |
| `SampleText`             | `sample-text-window-content.vue`              | –                    | –                                     |
| `Profile`                | `profile-window-content.vue`                  | –                    | –                                     |
| `Feature`                | `feature-window-content.vue`                  | –                    | –                                     |
| `FeatureStatistics`      | `feature-statistics-window-content.vue`       | –                    | –                                     |
| `FeatureValue`           | `feature-value-window-content.vue`            | –                    | –                                     |
| `Location`               | `location-window-content.vue`                 | –                    | –                                     |
| `BiblioEntries`          | `biblio-entries-window-content.vue`           | –                    | `update-query-param`                  |
| `DictQuery`              | `dict-query-window-content.vue`               | –                    | `update-query-param`                  |
| `ListMap`                | `geojson-table-window-content.vue`            | –                    | `update-query-param`, `update:params` |
| `GeojsonMap`             | `geojson-map-window-content.vue`              | –                    | –                                     |
| `CorpusQuery`            | `corpus-query-window-content.vue`             | –                    | `update-query-param`                  |
| `CorpusText`             | `corpus-text-json-window-content.vue`         | –                    | –                                     |
| `DataList`               | `data-list-window-content.vue`                | `title`, `window-id` | `update:params`                       |
| `FeatureDescriptionList` | `feature-description-list-window-content.vue` | –                    | `update:params`                       |
| `DataTable`              | `data-table-window-content.vue`               | –                    | –                                     |
| `ExploreSamplesForm`     | `explore-samples-form-window-content.vue`     | –                    | –                                     |
| `ExploreSamples`         | `explore-samples-window-content.vue`          | –                    | `update:params`                       |

## Shared helper fields

- `TextId`: `{ textId: string }`
- `TeiSource`: `{ teiSource: string }`
- `ShowCitation`: `{ showCitation: boolean }`
- `QueryString`: `{ queryString: string }`
- `FeatureValueGroup`: `{ label: string; values: Array<{ columnId: string; value: string }> }` — a
  set of feature values the user merged into one legend entry and one map marker. Used by `ListMap`.
  The schema also accepts the legacy `{ columnId, label, values: string[] }` form and normalizes it.

`TextId`, `TeiSource`, `ShowCitation`, and `QueryString` are shared schema fields. Schemas commonly
include `TeiSource` and `ShowCitation` through `.partial()`, which makes those fields optional.

- `TextId` is **required** for `Text`, `SampleText`, `Profile`, `Feature`, `CorpusText` and
  `DictQuery` (where it is the dictionary ID); it is optional (`.partial()`) for `ExploreSamples`,
  `ExploreSamplesForm`, `DataList`, `FeatureDescriptionList` and `DataTable`, and absent for `WMap`,
  `BiblioEntries`, `CorpusQuery`, `ListMap`, `GeojsonMap`, `FeatureStatistics`, `FeatureValue` and
  `Location`.
- `TeiSource` is optional everywhere it appears (`Text`, `SampleText`, `Profile`, `Feature`,
  `CorpusText`, `DataTable`).
- `ShowCitation` is optional in every schema that includes it — in practice every target type
  carries an optional `showCitation`. Only the target types listed under
  [Window controls](#window-controls) actually render a citation toggle button.
- `QueryString` is required for `BiblioEntries`, `DictQuery`, `CorpusQuery` and `WMap`, and defaults
  to `""` for `ListMap`.
- `ExploreSamplesQueryBase` (`ids`, `word`, `person`, `translation`, `comment`, `features`, `page`)
  is the shared optional field set behind `ExploreSamples` and `WMap.queryParams`.
- `ExploreSamplesQueryDbParams` adds a required `type: "samples" | "lingfeatures"` and is only used
  as `WMap.queryParams`.
- `CompareMarkersParams` is an empty schema object and is currently unused.

## Implemented window types

### `WMap`

Rendered as [geo-map-window-content.vue](../app/components/geo-map-window-content.vue).

- `params`:

```ts
{
  queryString: string;
  title?: string;
  endpoint: string;
  queryParams?: {
    ids?: string;
    word?: string;
    person?: string;
    translation?: string;
    comment?: string;
    features?: string;
    page?: number;
    type: "samples" | "lingfeatures";
  };
  scope?: Array<"reg" | "geo" | "diaGroup">;
  hideDefaultLayers?: boolean;
  showCitation?: boolean;
  dataListLayers?: Array<{
    id: string;
    title: string;
    color: string;
    enabled?: boolean;
    markers: Array<{
      id: string;
      label: string;
      placeName?: string;
      alt?: string;
      dataType: "Profile" | "Text" | "SampleText" | "Feature" | "CorpusText" | "BiblioEntries";
      coordinates: [number, number];
    }>;
  }>;
}
```

- Additional prop passed by `window-content.vue`: `:title="props.item.label"` (the window label, not
  `winbox.title`). The map toolbar uses `params.title` if set, otherwise the window label.
- For `endpoint: "data_markers"`, `useDataListMapWindowSync`, initialized by the window manager,
  supplies retained layers from the data-list map store. Hidden layers stay in the toolbar and can
  be toggled without an open list. An omitted `enabled` means visible.
- `scope` is part of the window identity (windows with the same endpoint, query and scope are reused
  instead of duplicated) and `hideDefaultLayers` is accepted by the schema but currently not read by
  the map component.

### `Text`

Rendered as [text-window-content.vue](../app/components/text-window-content.vue).

- `params`:

```ts
{
  textId: string;
  teiSource?: string;
  showCitation?: boolean;
}
```

- Rendering: fetches via `useTextById()` (`GET /vicav/text?id=<textId>`, `Accept: application/xml`,
  `retry: false`) and renders the returned HTML into `<div class="prose" v-if="data">`, showing a
  `LoadingIndicator` (and `opacity-50 grayscale`) while pending. For Playwright selectors and how to
  assert the window loaded the _correct_ text, see [tests.md](tests.md) → "Verifying a Text window
  loaded (and the correct text)".

### `SampleText`

Rendered as [sample-text-window-content.vue](../app/components/sample-text-window-content.vue).

- `params`:

```ts
{
  textId: string;
  teiSource?: string;
  showCitation?: boolean;
}
```

### `Profile`

Rendered as [profile-window-content.vue](../app/components/profile-window-content.vue).

- `params`:

```ts
{
  textId: string;
  teiSource?: string;
  showCitation?: boolean;
}
```

### `Feature`

Rendered as [feature-window-content.vue](../app/components/feature-window-content.vue).

- `params`:

```ts
{
  textId: string;
  teiSource?: string;
  showCitation?: boolean;
}
```

### `FeatureStatistics`

Rendered as
[feature-statistics-window-content.vue](../app/components/feature-statistics-window-content.vue).

- `params`:

```ts
{
  featureId: string;
  showCitation?: boolean;
}
```

### `FeatureValue`

Rendered as [feature-value-window-content.vue](../app/components/feature-value-window-content.vue).

- `params`:

```ts
{
  values: any[];
  showCitation?: boolean;
}
```

### `Location`

Rendered as [location-window-content.vue](../app/components/location-window-content.vue).

- `params`:

```ts
Row<FeatureType> & {
  showCitation?: boolean;
  [key: string]: unknown;
}
```

Where `FeatureType` is:

```ts
{
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: number[];
  };
  properties: any;
}
```

### `BiblioEntries`

Rendered as
[biblio-entries-window-content.vue](../app/components/biblio-entries-window-content.vue).

- `params`:

```ts
{
  queryString: string;
  xslt?: string;
  showMap?: boolean;
  isQueryVisible?: boolean; // no schema default; the component sets it to false when opening
  showCitation?: boolean;
}
```

- Event wired by `window-content.vue`: `update-query-param` updates the window query string.
- `isQueryVisible` controls the collapsible query area. The schema has **no** default for it; the
  component applies `isQueryVisible ??= false` on open, so the query area starts collapsed unless
  the URL state explicitly carries `isQueryVisible: true`. The component also sets `showMap` (map
  vs. list result) and collapses the area again when a new query is submitted.

### `DictQuery`

Rendered as [dict-query-window-content.vue](../app/components/dict-query-window-content.vue).

- `params`:

```ts
{
  textId: string;
  queryParams?: {
    q?: string | null;
    page?: number | null;
    pageSize?: number | null;
    id?: string | null;
    ids?: string | null;
    sort?: "asc" | "desc" | "none" | null;
    altLemma?: string | null;
    format?: string | null;
  };
  queryString: string;
  queryTemplateTextInput?: string;
  queryTemplate?: string;
  isTextInputManual?: boolean; // schema default: false
  isQueryVisible?: boolean; // schema default: true
  showCitation?: boolean;
}
```

- Event wired by `window-content.vue`: `update-query-param` updates the window query string.
- Initial UI state: `isQueryVisible` (schema default `true`) decides whether the collapsible query
  area is open on open; `isTextInputManual` (schema default `false`) switches between the free-text
  input and the query-template input; `queryTemplate` / `queryTemplateTextInput` restore the
  template and the text typed into it.

### `ListMap`

Rendered as [geojson-table-window-content.vue](../app/components/geojson-table-window-content.vue).

- `params`:

```ts
{
  queryString: string; // defaults to ""
  featureValueGroups?: Array<FeatureValueGroup>;
  showCitation?: boolean;
}
```

- `featureValueGroups` restores the user's custom feature value groups when the window is opened.
  The query string says which values are selected, the groups say which of them share a marker, so a
  shared link only reproduces the map if it carries both.
- Initial UI state: `queryString` (schema default `""`) pre-filters the table and is also used as
  the window title (falling back to `"Variety data"` when empty).
- Events wired by `window-content.vue`:
  - `update-query-param` updates the window query string.
  - `update:params` replaces the window params through the generic validated `updateWindowParams()`
    store path, which updates the encoded URL state. Emitted whenever a group is created, renamed,
    changed or dissolved.

### `GeojsonMap`

Rendered as [geojson-map-window-content.vue](../app/components/geojson-map-window-content.vue).

- `params`:

```ts
{
  markerType?: "petal" | "default";
  showCitation?: boolean;
}
```

The schema does not require a URL; the map content derives its data from the shared geojson store.
`markerType` selects the marker shape (`"petal"` for merged feature values, `"default"` otherwise).

### `CorpusQuery`

Rendered as [corpus-query-window-content.vue](../app/components/corpus-query-window-content.vue).

- `params`:

```ts
{
  queryString: string;
  mode?: "tag" | "text";
  showCitation?: boolean;
}
```

- Event wired by `window-content.vue`: `update-query-param` updates the window query string.
- `mode` sets the initial searchbar mode (`"tag"` or `"text"`).

### `CorpusText`

Rendered as
[corpus-text-json-window-content.vue](../app/components/corpus-text-json-window-content.vue).

- `params`:

```ts
{
  textId: string;
  hits?: string;
  u?: string;
  showCitation?: boolean;
  teiSource?: string;
}
```

### `DataList`

Rendered as [data-list-window-content.vue](../app/components/data-list-window-content.vue).

Single-type `CorpusText`, `SampleText`, `Profile`, and `Feature` lists are delegated to specialized
searchable/filterable simple-metadata list components. Mixed lists and other data types use the
grouped list rendering in `data-list-window-content.vue`.

- `params`:

```ts
{
  dataTypes: Array<
    "Profile" | "Text" | "SampleText" | "Feature" | "CorpusText" | "BiblioEntries"
  >;
  filterListBy?: {
    key: string;
    value: string;
  };
  listState?: {
    sortMode?: "hit-count" | "alphabetical";
    globalFilter?: string;
    facets?: Record<string, string[]>;
  };
  mapEnabled?: boolean;
  mapSyncId?: string;
  textId?: string;
  showCitation?: boolean;
}
```

- Additional props passed by `window-content.vue`: `:title="props.item.label"` and
  `:window-id="props.item.id"`.
- Event wired by `window-content.vue`: `update:params` replaces the window params through the
  generic validated `updateWindowParams()` store path, which updates the encoded URL state.
- The map dataset is keyed by `mapSyncId` (initially the window ID). Its table and filter state
  survive closing the list during the current session; reopening with the same ID reuses them.
- Initial UI state: `listState` restores sort mode, global filter and facets; `mapEnabled` decides
  whether the list is shown on the map; `filterListBy` restores the active filter. The component
  re-emits `update:params` whenever `filterListBy`, `mapSyncId`, `mapEnabled` or `listState` change.

### `FeatureDescriptionList`

Rendered as
[feature-description-list-window-content.vue](../app/components/feature-description-list-window-content.vue).

- `params`:

```ts
{
  taxonomyPath?: string;
  globalFilter?: string;
  textId?: string;
  showCitation?: boolean;
}
```

- Event wired by `window-content.vue`: `update:params` replaces the window params through
  `updateWindowParams()`, updating the encoded URL state.
- Initial UI state: `taxonomyPath` scopes the list to a category (dot separated path) and
  `globalFilter` pre-fills the filter box. The component re-emits `update:params` when the filter
  text changes or a category is opened/closed.

### `DataTable`

Rendered as [data-table-window-content.vue](../app/components/data-table-window-content.vue).

- `params`:

```ts
{
  dataTypes: Array<
    "Profile" | "Text" | "SampleText" | "Feature" | "CorpusText" | "BiblioEntries"
  >;
  filters?: Array<{
    key: string;
    value: string;
  }>;
  textId?: string;
  teiSource?: string;
  showCitation?: boolean;
}
```

- Initial UI state: `filters` pre-applies the table filters.

### `ExploreSamplesForm`

Rendered as
[explore-samples-form-window-content.vue](../app/components/explore-samples-form-window-content.vue).

- `params`:

```ts
{
  dataTypes: Array<
    "Profile" | "Text" | "SampleText" | "Feature" | "CorpusText" | "BiblioEntries"
  >;
  textId?: string;
  showCitation?: boolean;
}
```

- `dataTypes` scopes the form options to the selected data types. Submitting the form opens an
  `ExploreSamples` window and a `WMap` window with `endpoint: "compare_markers"`.

### `ExploreSamples`

Rendered as
[explore-samples-window-content.vue](../app/components/explore-samples-window-content.vue).

- `params`:

```ts
{
  ids?: string;
  word?: string;
  person?: string;
  translation?: string;
  comment?: string;
  features?: string;
  page?: number;
  dataType: "SampleText" | "Feature";
  region?: string;
  settlement?: string;
  textId?: string;
  showCitation?: boolean;
}
```

- Event wired by `window-content.vue`: `update:params` replaces the window params through the
  generic validated `updateWindowParams()` store path, which updates the encoded URL state.
- Initial UI state: `region` and `settlement` filter the sample list, `features` pre-selects
  features, and `page` sets the initial result page. The component re-emits `update:params` when the
  page changes.

## Schema And Render Coverage

Every `targetType` in the `Schema` discriminated union is currently rendered by
[window-content.vue](../app/components/window-content.vue), and every concrete render branch in
`window-content.vue` has schema coverage in [app/types/global.ts](../app/types/global.ts).

- `window-content.vue` ends with a `<pre v-else>` fallback that dumps the raw props. It only shows
  for a `targetType` that has no render branch, i.e. it is currently unreachable.
- [corpus-text-window-content.vue](../app/components/corpus-text-window-content.vue) exists but is
  **not** referenced by `window-content.vue`; the `CorpusText` branch renders
  `corpus-text-json-window-content.vue` instead. Both components read the same `hits` / `u` params.

## Window controls

WinBox title-bar controls are configured in
[app/stores/use-windows-store.ts](../app/stores/use-windows-store.ts) (`windowControlConfigs`). They
mutate params through `updateWindowParams()`, so their effect is persisted in the `w=` URL state.

| Control    | Target types                                                                                           | Effect                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `wb-cite`  | `ExploreSamples`, `Profile`, `Feature`, `CorpusText`, `SampleText`, `Text`, `FeatureValue`, `Location` | Toggles `params.showCitation`                                                        |
| `wb-map`   | `ListMap`                                                                                              | Opens a new `GeojsonMap` window (`markerType: "petal"`)                              |
| `wb-map`   | `DataList`                                                                                             | Toggles `params.mapEnabled` and sets `params.mapSyncId` (defaults to the window ID)  |
| `wb-table` | `GeojsonMap`                                                                                           | Opens a new `ListMap` window with the geojson table's global filter as `queryString` |
| `wb-map`   | `ListMap` (second map button)                                                                          | Opens a new `GeojsonMap` window                                                      |

- The `ListMap` window therefore gets two `wb-map` buttons. Both open a `GeojsonMap` window, but
  only the first `wb-map` element of the window gets a tooltip (the control setup writes the tooltip
  to `controls[0]`), and the later control overwrites it with "Open table".
- The `DataList` map button reflects the current state: it is marked with `wb-map-active` and
  `aria-pressed` while `mapEnabled` is `true`, and its tooltip switches between "Show on map" and
  "Remove from map".
- A `wb-tei` control is added separately in `createWindow()` for every window whose params carry a
  `teiSource`; it opens the TEI source in a new browser tab. It is not target-type specific.

## URL State And Updates

Encoding is not store-local: [app/utils/window-state-codec.ts](../app/utils/window-state-codec.ts)
provides `encodeWindowStates()` and `decodeWindowStates()`, which base64-encode the JSON array of
open window states (non-ASCII characters are escaped as `\uXXXX` before encoding). The store
([app/stores/use-windows-store.ts](../app/stores/use-windows-store.ts)) serializes the states and
persists them through a 150 ms-debounced `schedulePersistence()`; a watcher over the geometry
revision, the arrangement and the serialized states triggers it, and the debounce collapses bursts
of window moves/resizes into a single URL update. Persistence only runs on the `/` route.

The `w` query parameter holds the encoded array, including each window's `targetType`, title,
position, size and `params` object, except runtime `dataListLayers` for `WMap` windows with
`endpoint: "data_markers"` (those layers are stripped by `getPersistedWindowParams()`). Retained
list tables and layers are session state and are not restored after a reload without their list
windows. The `a` parameter stores the window arrangement.

Geometry details of the encoded state:

- `x`, `y`, `width` and `height` are stored as percentage strings with two-digit precision, e.g.
  `"42.31%"`.
- The z-index is serialized as `z` and read back as `zIndex` (falling back to `z`) when the state is
  restored.
- On restore, a window state is merged with the project-config menu entry matching the same
  `targetType` and `textId`, so project-config defaults fill in missing params.

`update-query-param` updates `params.queryString`. `update:params` is wired for `ListMap`,
`DataList`, `FeatureDescriptionList` and `ExploreSamples`; the store validates the replacement
params against that target type's schema before updating the URL. Query visibility and other UI
state carried in params (including `ListMap.featureValueGroups` and `DataList.listState`) is
therefore restored with a shared URL.

`updateWindowParams()` **replaces** the whole `params` object (it does not merge), and
`updateWindow()` validates the result against the target type's schema. On a validation failure
nothing changes and an error toast is shown. `updateQueryParam()` additionally retitles the window
to the new query string; for `ListMap` the title falls back to `"Variety data"` when the query
string is empty.

### Runtime-mutated params persisted in `w=`

| Param                          | Target type(s)                                                                                         | Written by                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `queryString`                  | `BiblioEntries`, `DictQuery`, `ListMap`, `CorpusQuery`                                                 | `update-query-param` → `updateQueryParam()`                                             |
| `showCitation`                 | `ExploreSamples`, `Profile`, `Feature`, `CorpusText`, `SampleText`, `Text`, `FeatureValue`, `Location` | `wb-cite` control → `updateWindowParams()`                                              |
| `mapEnabled`, `mapSyncId`      | `DataList`                                                                                             | `wb-map` control and the list component → `updateWindowParams()`                        |
| `filterListBy`, `listState`    | `DataList`                                                                                             | `update:params` → `updateWindowParams()`                                                |
| `featureValueGroups`           | `ListMap`                                                                                              | `update:params` → `updateWindowParams()`                                                |
| `globalFilter`, `taxonomyPath` | `FeatureDescriptionList`                                                                               | `update:params` → `updateWindowParams()`                                                |
| `page`                         | `ExploreSamples`                                                                                       | `update:params` → `updateWindowParams()`                                                |
| `dataListLayers`               | `WMap` (`endpoint: "data_markers"`)                                                                    | `useDataListMapWindowSync` → `updateWindowParams()`, but **stripped** before persisting |

## Maintenance Prompt

Use this prompt after changing window schemas, target types, or `window-content.vue` render
branches:

```text
Review app/types/global.ts and app/components/window-content.vue.
Also review app/stores/use-windows-store.ts for URL/state serialization helpers and generic window
param update paths, and app/utils/window-state-codec.ts for the encoding of the w= URL state.
Update docs/windowTypes.md so it accurately documents the current implemented window targetType
values, the component rendered for each targetType, the params shape for each schema, and any
additional props or events passed by window-content.vue.

Include:
- newly added, removed, or renamed targetType values
- changed params fields, optional/default behavior, and enum values
- params that control initial UI state when opening a window, such as collapsible query visibility
- changes to shared helper fields such as TextId, TeiSource, ShowCitation, and QueryString
- changed rendered component names, extra props, or emitted events wired in window-content.vue
- window params that are persisted to the encoded w= URL state, especially state updated via
  updateWindowParams()
- schema targetTypes that exist but are not rendered, or rendered branches that lack schema coverage

Keep the document concise, table/list driven, and consistent with the existing format. Do not change
application code.
```
