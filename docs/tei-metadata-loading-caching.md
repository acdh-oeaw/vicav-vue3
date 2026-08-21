# TEI Metadata Loading and Caching

Pinia store (Nuxt `defineStore`, setup style) that loads and normalizes the project's static TEI
corpus metadata, then exposes query-friendly derived data for the UI.

## Data source

- **Input:** `useProjectInfo().projectConfig.staticData.table` — an array of `TeiCorpus` and
  `GeoPlace` envelope entries, provided by `app/composables/use-project-info.ts`. The data is
  **static, project-bundled TEI metadata** (TEI/XML-derived JSON conforming to the TEI Guidelines,
  with GeoNames-backed place references). It is not fetched live at runtime.
- **Schemas:** Zod validators are built at module load from OpenAPI JSON schemas via
  `useOpenapiSchema` (`TeiCorpusSchema`, `TeiSchema`, `GeoPlaceSchema`). TS types come from
  `@/lib/api-client` (auto-generated from the same OpenAPI definition).

## Request pipeline and caching

The project config travels through three layers before it reaches the store. Each layer has a
different scope and TTL.

```
useProjectInfo()  ──►  useApiClient() / Api.vicav.getProject()  ──►  fetchWithETag (server) | native fetch (client)  ──►  upstream /vicav/project
       │                              │                                              │
       │                              │                                              └─ upstream HTTP cache (driven by Cache-Control / ETag from the API)
       │                              └─ customFetch: server uses fetchWithETag; client uses native fetch
       └─ TanStack QueryClient (one cache entry keyed by ["get-project-info"], 15-min staleTime,
           SSR timestamps bucketed to 3 min, 5-min default gcTime, default focus/reconnect refetch)
```

### Layer 1 — `useApiClient()` (`shared/utils/use-api-client.ts`)

A per-call factory (auto-imported into both the Vue app and Nitro server) that returns an
Orval-generated `Api` instance pre-configured for the current runtime:

- Sets `api.baseUrl` from `env.apiBaseUrl` (server) or `env.public.apiBaseUrl` (client). Defaults
  from `nuxt.config.ts`: server is `undefined` (so the Orval default `http://localhost:8984` is
  used); public default `https://vicav-dev.acdh.oeaw.ac.at`.
- If `env.public.apiUser` / `apiPass` are set, installs a `securityWorker` that injects
  `Authorization: Basic base64(user:pass)` on every request and forces `secure: true`.
- Wires a `customFetch` that branches on `typeof document`:
  - **Server** (`document === "undefined"`) → `fetchWithETag`.
  - **Client** → native `fetch` (no app-level HTTP cache in the browser).

Two module-level `Map`s back `fetchWithETag`:

```ts
const cache = new Map<string, { ETag: string; body: Uint8Array<ArrayBuffer>; expiresAt: Date }>();
const currentRequests = new Map<string, Promise<Response>>();
```

Caching policy, in order:

1. **Cache hit (fresh):** if `cache.get(url)?.expiresAt` is still in the future, return a synthetic
   `200` `Response` with the stored body and debug headers `X-Cache: fetchWithETag HIT` /
   `X-Cache-Expires: <ISO>`. No network call.
2. **Single-flight de-dup:** if a request to the same URL is already in flight, the second caller
   awaits the same `Promise` from `currentRequests` rather than issuing a parallel fetch (protects
   against healthy-check storms against a slow backend).
3. **Conditional GET with ETag:** otherwise, perform a `GET` carrying
   `If-None-Match: <previous ETag>` (the trailing `--gzip` suffix is stripped before sending, since
   the upstream signs the gzipped body).
4. **TTL from `Cache-Control`:** `max-age` is parsed from the response (`maxAge > 0 ? maxAge : 5`
   seconds; defaults to 5 s when the header is missing). The entry's `expiresAt` is set to
   `now + maxAge`, and a `setTimeout` reaps the entry after `2 * maxAge` of no reads.
5. **`304 Not Modified`:** refresh the cached body's `expiresAt` to `now + maxAge` and return a
   `200` with the existing bytes. Throws `Cache error!` if there is no cached body to fall back to.
6. **`200 OK`:** only stored if the response carries an `ETag` header — the cache entry is
   `{ ETag, body: Uint8Array, expiresAt }`. Responses without `ETag` are not cached.
7. **Error fallback:** on a thrown error, the in-flight entry is removed and the cached body is
   returned as a `200` with a console warning. If no cached body exists, the error is wrapped and
   rethrown.

Server-only caveats:

- The cache is per Nitro process, keyed on URL only (path + query). The module comment notes that in
  the Nuxt dev server the API routes and frontend live in isolated contexts, so the global `cache`
  does not persist across them in dev; in `nuxt build`/production, you get a single shared global.
- Method is implicitly `GET` (the comment in the file explicitly says "The rest of the code at the
  moment only works for GET requests.").
- A small race exists in the single-flight map (set / await / delete) — two near-simultaneous
  callers after the first deletion can both start fetches.
- If the upstream stops sending `ETag`, this layer effectively stops caching (the entry is never
  written). Without `Cache-Control: max-age`, the effective server-side TTL is 5 seconds.

### Layer 2 — TanStack `QueryClient` (`app/plugins/query-client.ts`)

`useProjectInfo` wraps `useQuery({ queryKey: ["get-project-info"], ... })` with no per-query
overrides, so the cache entry inherits the global defaults set by the `query-client` Nuxt plugin:

- `defaultOptions.queries.staleTime = 15 * 60 * 1000` (15 minutes).
- `defaultOptions.queries.placeholderData = keepPreviousData` (purely UX).
- `queryCache.onError` toasts errors client-side and logs server-side.

Reload triggers (all TanStack defaults, since `useProjectInfo` does not override them):

- **Within 15 minutes of the last successful fetch:** every `useProjectInfo()` call (across
  components, layouts, and stores) returns the cached `data` immediately. No network request.
  `isFetching` stays `false`.
- **After 15 minutes (stale):** the next mount/subscribe of an active observer triggers a background
  refetch in parallel with returning the stale `data`. `refetchOnWindowFocus: true`,
  `refetchOnReconnect: true`, and `refetchOnMount: true` are all at their TanStack defaults.
- **5 minutes of inactivity with no observers** (default `gcTime`): the cache entry is
  garbage-collected; the next mount performs a fresh fetch.
- **Manual `refetch()`** from any consumer (not currently used in this repo, but available).

There are **no** `invalidateQueries` / `setQueryData` / `removeQueries` / `resetQueries` calls in
`app/`, so no manual invalidation path exists. Reload is driven solely by TanStack defaults plus
`staleTime` and the SSR timestamp bucketing below.

### Layer 3 — SSR hydration and timestamp bucketing

The `query-client` plugin uses Nuxt's `useState("vue-query")` to ferry the `QueryClient` cache from
server to client:

- On the **server**, after `app:rendered`, the plugin dehydrates the cache and **floors the volatile
  timestamps to a 3-minute bucket** before serializing (`dataUpdatedAt`, `errorUpdatedAt`,
  `dehydratedAt` all rounded down to the nearest multiple of `3 * 60 * 1000`).
- On the **client**, in `app:created`, the plugin calls `hydrate(queryClient, state.value)` to
  rehydrate.

Effect: the SSR snapshot is intentionally "aged" by up to 3 minutes. Combined with the 15-minute
`staleTime`, the project config is considered fresh for at least 12 minutes after hydration, and the
client begins background refetching after ~12 effective minutes. The inline comment notes that the
maximum caching-friendly approach would be to set the timestamps to 0/NaN on the server and restore
the real timestamp on the client — they chose the bucketed middle ground.

### End-to-end behavior for `["get-project-info"]`

In the browser:

1. After SSR hydration, all `useProjectInfo()` consumers see cached `data` without a network call
   for ~12 minutes.
2. Once the cache goes stale, TanStack triggers a background refetch on focus/reconnect/mount that
   goes through `useApiClient`'s plain `fetch`, hitting the upstream directly. (`fetchWithETag` is
   **not** in the browser path.)
3. There is no in-app HTTP cache between the browser and the upstream; the browser's own HTTP cache
   and the upstream's `Cache-Control` are the only layers on the wire.

During SSR (or in server routes like `server/routes/status.ts` that also call `useApiClient()`):

1. The request goes through `fetchWithETag`. If the URL has a fresh cached entry, the body is served
   from memory without hitting the network.
2. Otherwise an `If-None-Match` GET is issued; on `304` the body is served from the cache; on `200`
   with `ETag` the body is stored and reaped after `2 * maxAge` of no reads. The effective
   server-side TTL for `/vicav/project` is the upstream's `Cache-Control: max-age` (or 5 s by
   default).
3. The TanStack `QueryClient` then caches the parsed `data` for the rest of the SSR pass and
   dehydrates it for the client.

## Data model

### Input types

- **`TeiCorpus`** — top-level container with `@id` and a `TEIs[]` array.
- **`TEI`** — individual TEI document with `teiHeader.fileDesc` (titleStmt, respStmts,
  publicationStmt, sourceDesc.recordingStmt, sourceDesc.biblStruct), `teiHeader.profileDesc`
  (particDesc.listPerson, settingDesc.place, textClass.catRefs, langUsage), and
  `teiHeader.encodingDesc.classDecl.taxonomies`. Attributes `@id` and `@hasTEIw` ("true"/"false" for
  TEI-W transcription).
- **`GeoPlace`** — geographic place with `@id`, `@type` ("reg" = region), prefLabel/standard/local
  place names, `geoNames_idno`, nested `location.country`.
- **`Person`** — corpus-level participant (`@id`, `@sex`/`sex`, `@age`, birth).
- **`Author` / `AuthorRef`** — distinguished by `@id` vs `@ref` on `persName`.
- **`RespStmt`** — links a `persName` (author or ref) to a `Responsibility` enum value.

### Enums

- `Responsibility` — `Author`, `Recording`, `Principal2`, `Transcription1`, `TransferToELAN` (the
  five supported ones, filtered via `supportedResponsibilities`).
- `BiblStructType` — `BookSection`, `JournalArticle`, `Thesis` (drives publication shape).
- `Unit` — `Page`, `Volume` (used to extract `biblScope` values).
- `DataTypesEnum` — high-level data type (e.g., `CorpusText`, `Feature`, `Profile`); mapped from the
  raw collection name via `@/config/dataTypes`.

### Output types

- **`rawItems: TeiCorpus[]`** — validated corpora with their inner `TEIs[]` re-validated.
- **`simpleItems: simpleTEIMetadata[]`** — flat per-TEI record (see fields below).
- **`persons: Person[]`** — corpus-level participant list extracted from the entry with
  `@id === "vicav_corpus"`.

### `simpleTEIMetadata` fields

- `id` — from `idno` (CorpusID type) or `@id` fallback
- `recordingDate`, `pubDate`
- `dataType` — resolved via `dataTypes` config
- `label` — title, person name, settlement, or id fallback (depends on data type and presence of
  persons)
- `title` — TEI title, optionally suffixed with first person name
- `author`, `recording`, `principal`, `transcription`, `transfer to ELAN` — arrays of
  `{given, family}` resolved against corpus-level `respStmts`
- `place` — `{settlement, country, region}` merged from inline TEI place and GeoPlace lookup
- `person` — array of `{name, sex, age, dob}` from corpus `listPerson`
- `resp` — recording interviewer name (resolved from corpus `respStmts` or raw `persName`)
- `category` — taxonomy category name (only for `CorpusText` data type)
- `duration` — formatted `HH:MM:SS` from `dur-iso`
- `audioAvailability` — from `availability.@status`; `Feature`/`Profile` and items without duration
  are forced to `"restricted"`; default `"unknown"`
- `@hasTEIw` — `"true"` / `"false"`
- `teiHeader` — raw header preserved
- `publication` — CSL-JS-shaped metadata (`refType`, `type`, `bibl` with
  author/editor/title/container-title/issued/publisherPlace/volume/page)

### Grouped output

`getGroupedSimpleItems(options)` returns a 4-level nested object:

```
country → region → place(settlement) → dataType → simpleTEIMetadata[]
```

- Filtered by `options.dataTypes` (allow-list) and optional `options.filterListBy` (`{key, value}`
  match).
- Sorted at every level using a numeric-aware `Intl.Collator`. Default compare is by `label`.

### `simpleMetadataAccessors`

Declarative metadata describing each presentable field (`id`, `label`, `title`, `dataType`,
`category`, `recordingDate`, `resp`, `duration`, `audioAvailability`, `@hasTEIw`, `country`,
`region`, `settlement`) with its display label, value extractor, and
`filterable`/`groupable`/`sortable` flags for UI components.

## Initialization

`initialize()` is idempotent (guarded by a module-level `initializationPromise`). On first call it:

1. Awaits `useProjectInfo().suspense()`.
2. Reads `projectConfig.staticData.table`.
3. Validates each entry with `TeiCorpusSchema`; for each corpus, recursively validates its `TEIs[i]`
   with `TeiSchema`. Failures are logged with `@id` context but do not abort the load.
4. Parses geo entries from the same table by looking for `text.body.listPlace` and validating each
   place with `GeoPlaceSchema`.
5. Builds `simpleItems` via `buildSimpleItems(parsedRawItems, parseGeoItems(table))` — for each TEI,
   resolves duration, settlement, persons, responsibilities, label, title, category, audio
   availability, and publication metadata; resolves geographic info by joining a `geoPlaceIndex`
   against `sameAs` refs in `settingDesc`/`langUsage`; finally validates each assembled record
   against `SimpleTEIMetadataSchema`. Invalid results are dropped.
6. Populates `persons` from the corpus-level `listPerson` of the `vicav_corpus` entry.

## Joins performed

- **Corpus metadata** — the `TeiCorpus` with `@id === "vicav_corpus"` provides the canonical
  `respStmts`, `listPerson`, and `taxonomies` referenced by individual TEIs.
- **Geo join** — `normalizeGeoReference` strips `geo:`, diacritics, whitespace/underscores/dashes,
  and lowercases. A `Map` is keyed on `@id`, all place-name variants, and `geoNames_idno`. TEIs look
  up by any of `settingDesc.place.@sameAs`, `settingDesc.setting.placeName.@sameAs`, or
  `langUsage.language.settingDesc.listPlace.place.@sameAs`.
- **Person join** — TEI `listPerson[].@sameAs` (with `corpus:` prefix stripped) matched against
  corpus `listPerson[].@id`.
- **Responsibility join** — TEI `respStmts[].persName.@ref` (with `corpus:` prefix) matched against
  corpus `respStmts[].persName.@ref`; then `Author` is distinguished from `AuthorRef` to extract
  `forename`/`surname` or `name`. Discrimination uses lightweight structural type guards,
  `isAuthor`/`isAuthorRef` (checking for an own `@id` vs. `@ref` property), **not** Zod `safeParse`.
  These guards run inside `resolveRecordingResponsibilityName` and `resolveResponsiblePeople`, which
  execute once per TEI item during `buildSimpleItems` — for a corpus with hundreds of items,
  per-call Zod validation there was measurably slower than a property check, so the schema-based
  `AuthorSchema`/`AuthorRefSchema` validators were removed in favor of the type guards (only
  `TeiCorpusSchema`, `TeiSchema`, and `GeoPlaceSchema` remain as Zod-backed validators; see
  "Schemas" above).
- **Category join** — first `catRef.@target` (with `corpus:` stripped) matched against the merged
  corpus `taxonomies.categories[].@id`.
- **Publication shape** — driven by `biblStruct.@type`; produces chapter, journal article, or thesis
  CSL-like objects, falling back to an empty external publication.

## Dependencies

### Direct imports (relative)

- `@/config/dataTypes.ts` — the `dataTypes` map; used by `resolveDataType` to map a collection name
  to a `DataTypesEnum` value.
- `@/lib/api-client` — types/enums: `Author`, `AuthorRef`, `BiblStructType`, `GeoPlace`, `Person`,
  `Responsibility`, `RespStmt`, `Taxonomy`, `TEI`, `TeiCorpus`, `TeiHeader`, `Unit`.
- `@/types/global.ts` — `DataTypesEnum`.
- `@/types/teiCorpus.ts` — `simpleTEIMetadata` type and `SimpleTEIMetadataSchema` Zod validator.

### Auto-imported (Nuxt/unimport)

- `z` (Zod) — `z.fromJSONSchema`, `z.ZodType`, `z.ZodError`.
- `defineStore` from Pinia.
- `ref` from Vue.
- `useOpenapiSchema` (`app/composables/use-openapi-schema.ts`) — supplies the JSON schemas used to
  build the Zod validators.
- `useProjectInfo` (`app/composables/use-project-info.ts`) — provides
  `projectData.value.projectConfig.staticData.table` and the `suspense()` promise. Wraps `useQuery`
  against `["get-project-info"]`; inherits the 15-minute `staleTime` and SSR hydration from
  `app/plugins/query-client.ts`.
- `useApiClient` (`shared/utils/use-api-client.ts`, auto-imported into both the Vue app and the
  Nitro server via Nuxt's generated `.nuxt/imports.d.ts`) — constructs an Orval `Api` instance with
  the runtime-configured base URL, optional basic-auth `securityWorker`, and a `customFetch` that is
  `fetchWithETag` on the server (ETag-conditional GET layer backed by two module-level `Map`s; TTL
  from upstream `Cache-Control: max-age`, default 5 s; reaped after `2 * maxAge`) and the native
  `fetch` on the client.

### Transitive

- `zod`, `pinia`, Vue 3 reactivity.

## Maintenance Prompt

Use this prompt after changing `app/stores/use-tei-headers-store.ts`,
`app/composables/use-project-info.ts`, `shared/utils/use-api-client.ts`,
`app/plugins/query-client.ts`, `app/plugins/use-tei-headers-store-init.ts`,
`app/types/teiCorpus.ts`, `app/assets/openapi.json`, or generated API client types/enums:

```text
Review app/stores/use-tei-headers-store.ts end-to-end, including initialize(), parsing helpers,
join logic, grouped output, and exported accessors. Also review app/composables/use-project-info.ts,
shared/utils/use-api-client.ts, app/plugins/query-client.ts, and app/plugins/use-tei-headers-store-init.ts.
If schema or generated client types changed, also review app/assets/openapi.json, app/lib/api-client, and
app/types/teiCorpus.ts.

Update docs/tei-metadata-loading-caching.md so it accurately documents current implemented behavior.

Include:
- data source shape and where staticData.table is read from
- request/caching pipeline changes (useApiClient customFetch path, fetchWithETag behavior, TanStack query stale/gc/refetch behavior, SSR hydration/dehydration details)
- initialization flow, idempotency/re-entrancy guards, and error/fallback behavior
- parsing/validation behavior (what is validated, what is skipped/dropped, logging behavior)
- output contracts for rawItems, simpleItems, persons, and grouped output
- changes to simpleTEIMetadata fields, enum handling, accessors, sorting/grouping/filter behavior
- join logic changes (geo/person/responsibility/category/publication joins)
- dependency/import changes that affect runtime behavior or typings
- any intentional limitations, caveats, or performance-relevant notes

Keep the document concise, structured, and implementation-accurate. Do not change application code.
```
