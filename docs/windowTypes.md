# Window Types

Implemented `targetType` values are taken from
[app/components/window-content.vue](../app/components/window-content.vue), and the shapes below are
taken from [app/types/global.ts](../app/types/global.ts).

## Shared helper fields

- `TextId`: `{ textId: string }`
- `TeiSource`: `{ teiSource: string }`
- `ShowCitation`: `{ showCitation: boolean }`
- `QueryString`: `{ queryString: string }`

Schemas commonly include `TeiSource` and `ShowCitation` through `.partial()`, which makes those
fields optional in the window params documented below.

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
}
```

- Additional prop passed by `window-content.vue`: `title: props.item.winbox.title`

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
}
```

- Event wired by `window-content.vue`: `update-query-param` updates the window query string.

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
  isTextInputManual?: boolean; // defaults to false
  isQueryVisible?: boolean; // defaults to true
}
```

- Event wired by `window-content.vue`: `update-query-param` updates the window query string.

### `ListMap`

Rendered as [geojson-table-window-content.vue](../app/components/geojson-table-window-content.vue).

- `params`:

```ts
{
	queryString: string; // defaults to ""
}
```

- Event wired by `window-content.vue`: `update-query-param` updates the window query string.

### `GeojsonMap`

Rendered as [geojson-map-window-content.vue](../app/components/geojson-map-window-content.vue).

- `params`:

```ts
{
  url: string;
  markerType?: "petal" | "default";
}
```

### `CorpusQuery`

Rendered as [corpus-query-window-content.vue](../app/components/corpus-query-window-content.vue).

- `params`:

```ts
{
	queryString: string;
}
```

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

Single-type `CorpusText`, `SampleText`, and `Feature` lists are delegated to specialized
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
  textId?: string;
}
```

- Event wired by `window-content.vue`: `update:params` replaces the window params through the
  generic validated `updateWindowParams()` store path, which updates the encoded URL state.

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
}
```

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

## Schema And Render Coverage

Every `targetType` in the `Schema` discriminated union is currently rendered by
[window-content.vue](../app/components/window-content.vue), and every concrete render branch in
`window-content.vue` has schema coverage in [app/types/global.ts](../app/types/global.ts).

## Maintenance Prompt

Use this prompt after changing window schemas, target types, or `window-content.vue` render
branches:

```text
Review app/types/global.ts and app/components/window-content.vue.
Also review app/stores/use-windows-store.ts for URL/state serialization helpers and generic window
param update paths.
Update docs/windowTypes.md so it accurately documents the current implemented window targetType
values, the component rendered for each targetType, the params shape for each schema, and any
additional props or events passed by window-content.vue.

Include:
- newly added, removed, or renamed targetType values
- changed params fields, optional/default behavior, and enum values
- changes to shared helper fields such as TextId, TeiSource, ShowCitation, and QueryString
- changed rendered component names, extra props, or emitted events wired in window-content.vue
- window params that are persisted to the encoded w= URL state, especially state updated via
  updateWindowParams()
- schema targetTypes that exist but are not rendered, or rendered branches that lack schema coverage

Keep the document concise, table/list driven, and consistent with the existing format. Do not change
application code.
```
