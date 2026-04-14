# Window Types

Implemented `targetType` values are taken from
[app/components/window-content.vue](../app/components/window-content.vue), and the shapes below are
taken from [app/types/global.ts](../app/types/global.ts).

## Shared helper fields

- `TextId`: `{ textId: string }`
- `TeiSource`: `{ teiSource?: string }`
- `ShowCitation`: `{ showCitation?: boolean }`
- `QueryString`: `{ queryString: string }`

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
  isTextInputManual?: boolean;
  isQueryVisible?: boolean;
}
```

### `ListMap`

Rendered as [geojson-table-window-content.vue](../app/components/geojson-table-window-content.vue).

- `params`:

```ts
{
	queryString: string;
}
```

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
  textId?: string;
}
```

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
