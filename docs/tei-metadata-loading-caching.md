# Project preparation and TEI metadata caching

This document describes the implemented behavior of the project-metadata pipeline: where the data
comes from, how it is fetched and cached, how it is validated and assembled, and what the prepared
outputs guarantee.

Implementation:

- `app/lib/project/prepare-project.ts` — validation, metadata assembly, joins, memoization, freezing
  (the whole pipeline).
- `app/stores/use-tei-headers-store.ts` — thin Pinia wrapper around `prepareProject()`.
- `app/composables/use-project-info.ts` — the TanStack query that fetches and prepares the project.
- `shared/utils/use-api-client.ts` — generated-client wiring plus the server-side HTTP cache.
- `app/plugins/query-client.ts` — TanStack `QueryClient`, SSR dehydration/hydration.
- `app/plugins/use-tei-headers-store-init.ts` — triggers store initialization on server and client.

## Data source

- **Fetch:** `GET /vicav/project` through the generated API client
  (`api.vicav.getProject({ headers: { accept: "application/json" } })`). The response is the
  generated `ProjectConfig` type: a body-level `ETag` (32-char hash of the upstream body), an
  optional `took` field, and `projectConfig`.
- **Table:** `projectConfig.staticData.table`. Per the bundled OpenAPI document
  (`app/assets/openapi.json`, schema `projectConfig_type`), `staticData` is a nullable object with
  `geo?: FeatureCollection[]` and `table?: (Biblio | Geo | TeiCorpus | GuidedTourSteps | object)[]`.
  `staticData` is not declared in `components.schemas`, so no Zod validator can be derived for it —
  the table is consumed structurally.
- **Content:** the table carries the project-bundled TEI metadata (TEI/XML-derived JSON conforming
  to the TEI Guidelines, with GeoNames-backed place references) plus auxiliary entries. It is
  _static_ per upstream deployment, but it is fetched at runtime and therefore travels through the
  caching pipeline below.
- **Read site:** `buildCacheEntry()` in `app/lib/project/prepare-project.ts` reads
  `response.projectConfig?.staticData?.table ?? []` from the **structured clone** of the upstream
  response. Missing `staticData` or `table` yields empty results, not an error.
- **Entry handling:** only two entry shapes are consumed.
  - Entries with a `TEIs` property are treated as `TeiCorpus` and validated.
  - Geo envelopes are found by probing `item`, `item.Geo`, and `item.TEI` for a
    `text.body.listPlace` array (the `Geo` schema carries places there).
  - `Biblio`, `GuidedTourSteps` and other generic objects are silently skipped.

## Request and caching pipeline

Three layers, in order: HTTP (server only) → TanStack query → preparation memo.

### Layer 1 — HTTP cache (`shared/utils/use-api-client.ts`)

`useApiClient()` creates a **fresh `Api` instance per call** and assigns it to a module-level `api`
variable (the last instance wins); the instance is pre-configured for the current runtime and
returned to the caller. The generated client is produced by `swagger-typescript-api` from
`app/assets/openapi.json` (`app/lib/api-client/index.ts`).

- **Base URL:** on the server `api.baseUrl = env.apiBaseUrl` when
  `import.meta.server && !isCI && env.apiBaseUrl`; otherwise `env.public.apiBaseUrl`. The client
  only ever uses `env.public.apiBaseUrl`. With the `nuxt.config.ts` defaults (server
  `apiBaseUrl: undefined`, public `https://vicav-dev.acdh.oeaw.ac.at`) both runtimes end up on the
  public dev URL; the generated default `http://localhost:8984` applies only when both env values
  are unset.
- **Auth:** if `env.public.apiUser`/`apiPass` are set, a `securityWorker` injects
  `Authorization: Basic base64(user:pass)` on every request and forces `secure: true`.
- **`customFetch`:** branches on `typeof document`:
  - **Server** (`document === "undefined"`) → `fetchWithETag`.
  - **Client** → native `fetch` (no app-level HTTP cache in the browser).

`fetchWithETag()` (`shared/utils/use-api-client.ts`) implements the server-side conditional-GET
layer over two module-level `Map`s (`cache`, `currentRequests` + `currentRequestRefs`):

1. **Fresh cache hit:** if `cache.get(url)?.expiresAt` is still in the future, a synthetic `200`
   `Response` with the stored body and the debug headers `X-Cache: fetchWithETag HIT` /
   `X-Cache-Expires: <ISO>` is returned. No other headers are copied (no `ETag`/`Content-Type`); the
   generated client parses the body as JSON regardless. No network call.
2. **Single-flight de-dup:** if a request to the same URL is already in flight, concurrent callers
   await the same `Promise` instead of issuing parallel fetches (protects against healthy-check
   storms against a slow backend). Every caller increments `currentRequestRefs[url]` synchronously
   before awaiting; the entry is removed only when the last awaiter releases it (refcount reaches
   zero).
3. **Conditional GET:** otherwise a `GET` is issued carrying `If-None-Match: <previous ETag>`. The
   trailing `--gzip` suffix is stripped before sending, because the upstream signs the gzipped body.
4. **TTL from `Cache-Control`:** `max-age` is parsed from the response; the effective TTL is
   `maxAge > 0 ? maxAge : 5` seconds (5 s default when the header is missing). The entry's
   `expiresAt` is set to `now + maxAge`, and a one-shot `setTimeout` calls
   `deleteFromCacheIfExpired` after `2 * maxAge`; the reap only deletes an entry that is expired by
   then, so a `304` refresh in the meantime extends `expiresAt` and turns the pending reap into a
   no-op.
5. **`304 Not Modified`:** the cached body's `expiresAt` is refreshed to `now + maxAge` and the
   stored bytes are returned as a `200`. Without a cached body this throws `Cache error!`.
6. **`200 OK`:** if the response carries an `ETag`, the body is stored **as opaque bytes**
   (`new Uint8Array(await response.clone().arrayBuffer())` — no JSON re-parse/re-serialize) and a
   fresh `response.clone()` is returned, so concurrent awaiters never share a body stream (sharing
   it causes "Body has already been consumed" in the generated client's `response.json()`).
   Responses without an `ETag` are returned as `response.clone()` but are not cached.
7. **Error fallback:** on a thrown error the in-flight entry is removed and the cached body is
   returned as a `200` with a console warning. With no cached body the error is wrapped and
   rethrown.

Server-only caveats:

- The cache is per Nitro process and keyed on URL only (path + query); credentials are not part of
  the key (fine in practice — the app is configured with a single `apiUser`/`apiPass`).
- In the Nuxt dev server the API routes and the frontend run in isolated contexts, so the global
  `cache` does not persist across them; in `nuxt build`/production there is one shared global.
- The method is implicitly `GET` (the file comment states that the rest of the code only works for
  GET requests).
- `fetchWithETag` is exported so `shared/utils/use-api-client.test.ts` can call it directly under a
  stubbed `globalThis.fetch` — do not remove the export.
- If the upstream stops sending `ETag`, this layer stops caching entirely. Without
  `Cache-Control: max-age` the effective server-side TTL is 5 seconds.

### Layer 2 — TanStack `QueryClient` (`app/plugins/query-client.ts`)

`useProjectInfo(options?)` (`app/composables/use-project-info.ts`) wraps
`useQuery({ queryKey: ["get-project-info"], ... })`:

- `enabled: options?.enabled` — currently unused by every caller, so the query is always enabled.
- `retry: false` — a failed request is not retried by TanStack.
- `shallow: true` — the prepared response is an immutable snapshot; only replacement needs to be
  reactive.
- `structuralSharing: false` — no structural-sharing pass over the frozen snapshot.
- `queryFn` — fetches the project and **prepares it inside the query**: it returns
  `(await prepareProject(response.data, api.baseUrl, { authenticated })).response`. The query data
  is therefore the _prepared_ response (including `projectConfig._validationErrors`), not the raw
  upstream body.

Global defaults come from the `project-query-client` Nuxt plugin:

- `defaultOptions.queries.staleTime = 15 * 60 * 1000` (15 minutes).
- `defaultOptions.queries.placeholderData = keepPreviousData` (purely UX).
- `queryCache.onError` — toasts the error client-side (via `describeApiError`), logs it server-side.

Reload triggers (TanStack defaults, none of them overridden):

- **Within 15 minutes of the last successful fetch:** every `useProjectInfo()` consumer returns the
  cached `data` immediately; no network request, `isFetching` stays `false`.
- **After 15 minutes (stale):** the next mount/subscribe of an active observer triggers a background
  refetch in parallel with returning the stale `data`. `refetchOnWindowFocus`, `refetchOnReconnect`
  and `refetchOnMount` are all at their defaults (`true`).
- **5 minutes of inactivity with no observers** (default `gcTime`): the cache entry is
  garbage-collected and the next mount performs a fresh fetch.
- **Manual `refetch()`** from any consumer (available, currently unused).
- There are **no** `invalidateQueries` / `setQueryData` / `removeQueries` / `resetQueries` calls in
  `app/`, so no manual invalidation path exists. Reload is driven solely by TanStack defaults plus
  `staleTime` and the SSR timestamp bucketing below.

### Layer 3 — SSR hydration and timestamp bucketing

The `project-query-client` plugin uses Nuxt's `useState("vue-query")` to ferry the `QueryClient`
cache from server to client:

- On the **server**, after `app:rendered`, the plugin dehydrates the cache and **floors the volatile
  timestamps to a 3-minute bucket** (`Math.floor(t / (3 * 60 * 1000)) * (3 * 60 * 1000)`) for
  `dataUpdatedAt`, `errorUpdatedAt` and `dehydratedAt` (each floored independently).
- On the **client**, the plugin calls `hydrate(queryClient, state.value)` **synchronously in its
  `setup()`** — during plugin setup, not in an `app:created` hook.
- **Plugin ordering** is resolved through `dependsOn`, not file order. The init plugin
  (`app/plugins/use-tei-headers-store-init.ts`) declares
  `dependsOn: ["pinia", "project-query-client"]`, so the `project-query-client` plugin's `setup()`
  (and therefore the client-side hydration) has already run before `tei-headers-init` registers its
  `app:created` hook. The cache is hydrated **before** the store's `initialize()` runs, and
  `suspense()` resolves from the hydrated cache without a network round-trip.

Effect: the SSR snapshot is intentionally "aged" by up to 3 minutes. Combined with the 15-minute
`staleTime`, the project config is considered fresh for at least ~12 minutes after hydration, and
the client starts background refetching after ~12 effective minutes.

## Preparation

`app/lib/project/prepare-project.ts` owns the whole pipeline: schema validation, metadata assembly,
joins, memoization and freezing. The store only calls `prepareProject()` and copies the result into
its refs.

### Entry point and guards

`prepareProject(input, backendIdentity, { authenticated })` resolves in this order:

1. **Weak response association** — `preparedResponses` is a module-scoped `WeakMap` keyed by the
   **prepared** response object; the lookup uses `toRaw(input)`. The query's `queryFn` prepares the
   response and returns it, and the store passes that very object to `prepareProject()`, so the
   store hits this map and consumes the already prepared metadata — including for authenticated or
   unversioned queries — without preparing twice.
2. **Parsed-corpus memo** — `parsedCorpusByEtag` maps
   `JSON.stringify([backendIdentity without trailing "/", ETag])` to the fully prepared entry
   `{ response, simpleItems, persons }`. The body ETag changes only when the upstream body changes,
   so warm SSR requests skip the entire parse pipeline. The map is a bounded **LRU by recency** (cap
   4): a hit re-inserts the entry at the most-recent position, and the oldest entry is evicted when
   the cap is exceeded. Backing the cap with the ETag (rather than a TTL) keeps the steady state to
   one live generation while covering rolling deploys.
3. **Cross-request parse dedup** — `inFlightParses` maps the same key to its in-flight preparation
   promise. On a cold miss — most importantly right after a deploy — the first request registers its
   promise before awaiting it, and concurrent requests for the same key await that promise instead
   of each running the full pipeline. Entries are removed in a `finally` on settle (success or
   failure), so the map is empty except while a preparation is actually running.
4. **No key** — if the response carries no `ETag`, or the request is authenticated, the module-scope
   maps are bypassed entirely and the preparation is per-call (nothing is shared across requests). A
   missing ETag is reported once per process via `console.warn` ("Project response carries no ETag;
   preparation is not memoized across requests.").

Error/fallback semantics:

- A failing preparation publishes nothing: the memo write happens only after a successful build, so
  a failure can be retried by the next request.
- The memo key includes the **backend identity**, not only the ETag — two backends can serve the
  same ETag with different bodies.
- Authenticated requests are never memoized, so a deployment with `apiUser` re-prepares the project
  on every request.
- If `staticData` or `table` is missing, `?? []` yields empty `simpleItems`/`persons` without error.

### Steps (a memo hit skips the parsing steps entirely)

1. The upstream response is `structuredClone`d (`toRaw(input)` first, to drop reactive proxies) into
   `response`.
2. **Corpus validation** — each table entry with a `TEIs` property is validated with
   `TeiCorpusSchema`, which recursively validates the inner `TEIs[]` as well (there is no separate
   per-TEI parse, and the TEIs are therefore not parsed a second time). Failures are logged with
   `console.error` (the item's `@id` when present, plus the Zod error), the item is dropped, and a
   `"corpus"` diagnostic is recorded. Non-corpus entries are skipped silently.
3. **Geo envelope parsing** — `item`, `item.Geo` and `item.TEI` are probed for a
   `text.body.listPlace` array (first candidate that yields at least one valid place wins). Each
   place is validated with `GeoPlaceSchema`; invalid places are dropped and recorded as
   `"geographic-place"` diagnostics.
4. **Metadata assembly** — `buildSimpleItems()` resolves, per TEI: duration, settlement, persons,
   responsibilities, label, title, category, audio availability, publication, place and coordinates,
   then validates the assembled record against `SimpleTEIMetadataSchema`. Invalid records are
   dropped and recorded as `"metadata"` diagnostics.
5. **GeoJSON validation** — the feature collections in `staticData.geo` are validated with
   `GeoFeatureSchema.loose()`; invalid features are replaced by `null` in the cloned response and
   recorded as `"geojson"` diagnostics. This step is **skipped when the input already carries
   `projectConfig._validationErrors`** (i.e. when a previously prepared response is prepared again,
   as happens after SSR hydration): in that case the previously recorded `geojson` diagnostics are
   carried over unchanged, while the other diagnostic sources are regenerated from the table.
6. **Diagnostics** — `response.projectConfig._validationErrors` is set to the collected diagnostics
   whenever `projectConfig` exists (an empty array when nothing failed).
7. **`persons`** — the corpus-level participant list of the `vicav_corpus` entry
   (`teiHeader.profileDesc.particDesc.listPerson`), `[]` if that entry is missing or failed
   validation.
8. **Freezing** — the entry is deeply frozen once, at cache-write time. `deepFreeze` recursively
   `Object.freeze`s nested objects and arrays, skips already-frozen subtrees (cache entries share
   references) and uses a `WeakSet` guard against circular references. Memo hits and in-flight-dedup
   hits hand out the frozen references as-is, so no Vue reactive proxy ever wraps data shared across
   concurrent SSR requests. Any later in-place mutation throws a `TypeError` in strict mode instead
   of silently corrupting shared state.

## Output contracts

`prepareProject()` resolves to a frozen `CacheEntry` (`ReadonlyDeep<CacheEntry>`):

- **`response: ProjectResponse`** — a `structuredClone` of the upstream response, with
  `projectConfig._validationErrors` populated and invalid GeoJSON features replaced by `null`.
  `ProjectResponse` (`app/types/project.ts`) extends the generated `ProjectConfig` and adds
  `projectConfig?._validationErrors?: Array<ValidationDiagnostic>`.
- **`simpleItems: simpleTEIMetadata[]`** — flat, one record per TEI (fields below).
- **`persons: Person[]`** — corpus-level participants (see above).

A `ValidationDiagnostic` has a deterministic `id` (a JSON string of source, index, item id and
issues), a `source` (`"corpus" | "geographic-place" | "metadata" | "geojson"`), an optional
`itemId`, an `index` (the table position for corpora, `"<item>:<place>"` for geographic places, the
`@id` for derived metadata, and `"<collection>:<feature>"` for GeoJSON), and `issues` with `code`,
`path` and `message`. Diagnostics contain neither the invalid records nor Zod error instances, so
they are JSON-serializable and safe to dehydrate to the browser.

The validated corpora themselves are **internal** to the pipeline: there is no `rawItems` output,
and the store exposes neither corpora nor header copies. When served from the memo (the common case
on a warm process), all three outputs are shared by reference across SSR requests and deeply frozen.
The public ref types intentionally remain the mutable types; immutability is enforced at runtime
(and at compile time inside the pipeline module via `ReadonlyDeep<CacheEntry>`).

### `simpleTEIMetadata` fields

Schema: `SimpleTEIMetadataSchema` (`app/types/teiCorpus.ts`). It is a plain `z.object`, so unknown
keys — including the raw `teiHeader` — are stripped from the assembled record.

- `id` — `publicationStmt.idno.$` (no type filtering; the wanted idno has a type ending in
  `CorpusID`, but only one idno is considered), falling back to `TEI.@id`, then `"no_id"`.
- `teiSource_idno` — `publicationStmt.teiSource_idno.$` (optional).
- `recordingDate` — `recording.date["@when"]`. The schema is a union of `string` and `TeiDate`; the
  preparation only ever produces the string form, but the accessor handles both.
- `pubDate` — `publicationStmt.date.$`, falling back to `"unknown"`.
- `dataType` — resolved from the corpus entry's `@id` via `@/config/dataTypes` (matching the
  `collection` field, e.g. `vicav_corpus` → `CorpusText`); unknown collections fall back to
  `"Text"`.
- `geoSource` — the corpus entry's `@id` (e.g. `vicav_corpus`). The GeoJSON/map stores join on this
  value as `properties.referencedBy[].source`.
- `label` — precedence: `CorpusText` → first TEI title; else first person's name (even if empty);
  else first TEI title; else `TEI.@id` → `publicationStmt.idno.$` → `"no_id"`. (The trailing
  `placeSettlement` branch in `resolveLabel` is unreachable.)
- `title` — first TEI title, suffixed with ` – <first person name>` when a named person exists;
  falls back to `label` when there is no title.
- `author`, `recording`, `principal`, `transcription`, `transfer to ELAN` — arrays of
  `{given, family}` for the five supported responsibilities, taken from the **item's own**
  `fileDesc.titleStmt.respStmts` and filtered by responsibility value (missing entries → `[]`).
- `place` — `{settlement, country, region}`. The inline TEI `profileDesc.settingDesc.place` values
  win; gaps are filled from the GeoPlace index lookup. `settlement` comes from `place.placeName.$`,
  else the first `settlement.name[].$`, else the first English (`@lang === "en"`) settlement name.
- `person` — array of `{name, sex, age, dob}` joined from the corpus `listPerson`; fallbacks
  `sex: @sex ?? sex.$ ?? "n/a"`, `age: @age ?? "n/a"`, `dob: birth.$ ?? birth.date.$ ?? "n/a"`.
- `resp` — for `CorpusText` without `recording.respStmt`: `"Unknown"`; otherwise resolved from
  `recording.respStmt.persName`. An `@ref` value is looked up in the corpus responsibility index and
  rendered as the matched author's display name (`forename surname`, or `name`); when there is no
  match (or no corpus metadata) the `corpus:`-stripped `@ref` is used. A non-ref `persName` is
  rendered directly and yields `""` when it carries no name.
- `category` — taxonomy category name, only for `CorpusText` (else `""`); the first `catRef.@target`
  is matched against the merged corpus taxonomies; `"Unknown"` when there is no header or no match.
- `duration` — `HH:MM:SS` (the hours part only when non-zero) derived from `@dur-iso`. Parsing is
  `parseInt` after stripping `PT` and `.0`, so only `PT<n>.0S`-shaped values are handled.
- `audioAvailability` — from `publicationStmt.availability.@status`; `Feature`/`Profile` and items
  without a duration are forced to `"restricted"`; the default is `"unknown"`.
- `@hasTEIw` — normalized: `"true"` only when the raw attribute is exactly `"true"`, else `"false"`.
- `geoReference` — `profileDesc.settingDesc.place.@sameAs` (optional).
- `coordinates` — `[longitude, latitude]` parsed from `profileDesc.settingDesc.place.location.geo.$`
  (`"lat,lon"`); omitted when missing, non-finite or out of range (|lat| > 90, |lon| > 180).
- `publication` — CSL-like metadata. `refType` is always `"external"`; `type` is `"chapter"`
  (`bookSection`), `"journalArticle"`, `"book"` (for `thesis`), or `""` (unmapped or missing
  `biblStruct`); `bibl` carries `author`/`editor`/`title`/`container-title`/`issued`/
  `publisherPlace`/`volume`/`page`.

### Grouped output

`groupSimpleItems(items, options)` returns a 4-level nested object:

```
country → region → place(settlement) → dataType → simpleTEIMetadata[]
```

- Filtered by `options.dataTypes` (allow-list) and optionally by `options.filterListBy` (strict
  string equality via the accessor's `getValue`).
- The **items** are sorted once, globally, before grouping (non-mutating `toSorted`); the default
  comparator compares `label` with a module-scoped numeric-aware `Intl.Collator` (`numeric: true`,
  `sensitivity: "base"`). A custom comparator can be passed via `options.sort`.
- The **record keys** at every nesting level are sorted with the same collator (`sortRecordByKeys`).
- Items with missing geo fields land in the `""` bucket at the respective level.
- Not memoized: every call re-filters, re-sorts and rebuilds the tree. The store's
  `getGroupedSimpleItems()` has no in-app callers; the live call site is
  `app/components/data-list-window-content.vue`, which calls the re-exported `groupSimpleItems()`
  inside a Vue `computed` over the map store's filtered items. A store-level memo is a deferred
  plan.

### Accessors

`simpleMetadataAccessors` declaratively describes each presentable field (`id`, `label`, `title`,
`dataType`, `category`, `recordingDate`, `resp`, `duration`, `audioAvailability`, `@hasTEIw`,
`country`, `region`, `settlement`) with its display label, value extractor and
`filterable`/`groupable`/`sortable` flags for UI components. `id`, `recordingDate` and `duration`
are not filterable; only the three place fields are groupable; everything is sortable. The
`recordingDate` accessor accepts both the string and the `TeiDate` shape, and the place accessors
fall back to `""` for missing values. `getSimpleMetadataValue(item, key)` is the single read
accessor used by the grouping/filtering code.

## Store initialization

`app/stores/use-tei-headers-store.ts` is a thin wrapper around `prepareProject()`:

- `simpleItems`, `persons` — `shallowRef`s holding the prepared arrays.
- `initialization` — a snapshot `{ ready, pipelineVersion, projectIdentity, etag }`; the pipeline
  version is currently `2`, the project identity is `config.public.apiBaseUrl` without the trailing
  slash.
- `initialize(options?)` — awaits `useProjectInfo().suspense()`, then either
  - **reuses a compatible hydrated snapshot** (`options.reuseHydratedState` plus matching pipeline
    version, project identity and ETag): the already hydrated metadata is re-frozen via
    `freezeCacheEntry()` and re-assigned, without reading the raw table; or
  - **prepares** the envelope via `prepareProject(envelope, backendIdentity, { authenticated })` and
    assigns the result, then records the initialization snapshot.
- A store-local `let inFlight` guard shares a single run between concurrent callers and is cleared
  in a `finally`, so a failed init stays **retryable**.
- `getGroupedSimpleItems(options)` — delegates to `groupSimpleItems(simpleItems.value, options)`.

### Trigger — `app/plugins/use-tei-headers-store-init.ts`

- **Server:** the plugin awaits `metadataStore.initialize()` directly, so the SSR render blocks
  until the project data is fetched and prepared. A rejected init fails the render (the query error
  is logged server-side by the `query-client` plugin's `onError`).
- **Client:** the plugin hooks `app:created` (after the `project-query-client` plugin's setup, see
  Layer 3) and awaits `initialize({ reuseHydratedState: true })` there; the framework does not wait
  for it, so components reading the store see empty arrays until init resolves.
- Components never call `initialize()` themselves; they only read the store's refs.

## Joins performed

- **Corpus metadata** — the validated `TeiCorpus` with `@id === "vicav_corpus"` provides the
  canonical `respStmts`, `listPerson` and `taxonomies` referenced by individual TEIs. If it is
  missing (absent or failed validation), `persons` is `[]`, `category` is `""`/`"Unknown"`, the
  responsibility arrays are empty, and `resp` falls back to the stripped `@ref`.
- **Geo join** — `normalizeGeoReference` strips a `geo:` prefix (case-insensitive), diacritics
  (NFD), whitespace/underscores/dashes, and lowercases. The index `Map` is keyed on `@id`, all
  place-name variants (`prefLabel`/`standard`/`local`) and `geoNames_idno`. TEIs look up by
  `settingDesc.place.@sameAs`, `settingDesc.setting.placeName.@sameAs` or
  `langUsage.language.settingDesc.listPlace.place.@sameAs` (first hit wins). Places with
  `@type === "reg"` fill the `region` slot, all others fill `settlement`; `country` comes from
  `location.country.$`.
- **Person join** — the TEI's `profileDesc.particDesc.listPerson[].@sameAs` (falling back to the
  node's `$` text), with the `corpus:` prefix stripped, matched against the corpus
  `listPerson[].@id`.
- **Responsibility join** — the item's `respStmts[].persName` is resolved against the corpus-level
  `respStmts` index, which is keyed by `@ref` for `AuthorRef` values and by `corpus:<@id>` for full
  `Author` values. A matched corpus `persName` is read as a full `Author` to extract
  `forename`/`surname` (otherwise `name` → `given` with an empty `family`, otherwise
  `{given: "", family: ""}`). `Author`/`AuthorRef` discrimination uses the lightweight structural
  guard `isAuthorRef` (own `@ref` string) rather than Zod `safeParse` — per-call Zod validation
  there was measurably slower for large corpora, so the old `AuthorSchema`/`AuthorRefSchema`
  validators were removed. Only `TeiCorpusSchema` and `GeoPlaceSchema` remain Zod-backed; the other
  structural guards are `hasIDAttribute` and `isTeiCorpus`.
- **Category join** — the first `catRef.@target` (with `corpus:` stripped) is matched against the
  merged corpus `taxonomies.categories[].@id`; the name comes from `catDesc.name.$`, falling back to
  `catDesc.$`.
- **Publication shape** — driven by `biblStruct.@type` (`bookSection` → `"chapter"`,
  `journalArticle` → `"journalArticle"`, `thesis` → `"book"`); anything else yields the empty
  external publication. `volume`/`page` come from `monogr.imprint.biblScopes` matched by `@unit`.

## Enums

- `Responsibility` — the generated enum has 29 members; the preparation only consumes the five in
  `supportedResponsibilities` (`Author` → `"author"`, `Recording` → `"recording"`, `Principal2` →
  `"principal"`, `Transcription1` → `"transcription"`, `TransferToELAN` → `"transfer to ELAN"`); all
  other `respStmt`s are ignored. The enum values are the keys of the corresponding
  `simpleTEIMetadata` arrays.
- `BiblStructType` — 13 members; only `BookSection`, `JournalArticle` and `Thesis` drive a
  publication shape.
- `Unit` — `page`, `volume`, `issue`; the preparation uses `Page` and `Volume` to extract
  `biblScope` values.
- `DataTypesEnum` — `Profile`, `Text`, `SampleText`, `Feature`, `CorpusText`, `BiblioEntries` (from
  `@/types/global.ts`); the resolved data type of a record is constrained by this enum.

## Dependencies

### Direct imports

`app/lib/project/prepare-project.ts`:

- `type-fest` (type-only) — `ReadonlyDeep<T>` for the cache-entry type.
- `zod` (as `* as z`) — `z.fromJSONSchema`, `z.ZodType`, `z.ZodError`.
- `vue` — `toRaw` (unwrapping reactive proxies before validation).
- `@/composables/use-openapi-schema.ts` — `useOpenapiSchema`; builds `TeiCorpusSchema` and
  `GeoPlaceSchema` at module top level. The composable remaps `#/components/schemas/` refs to
  `#/$defs/` and returns a self-contained JSON schema, which is why the top-level call is safe.
- `@/config/dataTypes.ts` — the `dataTypes` map; used by `resolveDataType` to map a collection name
  to a `DataTypesEnum` value.
- `@/lib/api-client` — types/enums: `Author`, `AuthorRef`, `BiblStructType`, `GeoPlace`, `Person`,
  `Responsibility`, `RespStmt`, `Taxonomy`, `TEI`, `TeiCorpus`, `TeiHeader`, `Unit`.
- `@/types/global.ts` — `DataTypesEnum`, `GeoFeatureSchema`.
- `@/types/project.ts` — `ProjectResponse`, `ReadonlyProjectResponse`, `ValidationDiagnostic`.
- `@/types/teiCorpus.ts` — `simpleTEIMetadata` type and `SimpleTEIMetadataSchema` Zod validator.

`app/stores/use-tei-headers-store.ts`:

- `pinia` — `defineStore`.
- `type-fest` (type-only) — `ReadonlyDeep<T>` for the store's cache-entry view.
- `@/lib/api-client` — `Person` type.
- `@/lib/project/prepare-project.ts` — `prepareProject`, `freezeCacheEntry`, `groupSimpleItems`, and
  the re-exported `TeiCorpusSchema` / `GeoPlaceSchema` / `simpleMetadataAccessors` /
  `getSimpleMetadataValue`. The schema validators, the build helpers, `parsedCorpusByEtag` and
  `inFlightParses` are owned by that module — not by the store.
- `@/types/teiCorpus.ts` — `simpleTEIMetadata` type.

`shared/utils/use-api-client.ts`:

- `ci-info` — `isCI`, used to keep the server from using a private `apiBaseUrl` in CI.
- `@/lib/api-client` — the generated `Api` class and `RequestParams` type.

`app/composables/use-openapi-schema.ts`:

- `zod/v4/core` (type-only) — `JSONSchema` typing for the bundled OpenAPI document.

### Auto-imported (Nuxt/unimport)

- `ref`, `shallowRef` from Vue.
- `useProjectInfo` (`app/composables/use-project-info.ts`) — provides `projectData.value` and the
  `suspense()` promise; wraps `useQuery` against `["get-project-info"]` and performs the preparation
  inside the query function.
- `useRuntimeConfig` — for the public project identity and the `apiUser` flag.
- `useApiClient` (`shared/utils/use-api-client.ts`, auto-imported into both the Vue app and the
  Nitro server) — creates an `Api` instance (generated by `swagger-typescript-api`) with the
  runtime-configured base URL, the optional basic-auth `securityWorker`, and a `customFetch` that is
  `fetchWithETag` on the server and native `fetch` on the client.

### Transitive

- `pinia`, Vue 3 reactivity.

## Diagnostics reporting

`app/plugins/project-validation.client.ts` depends on `project-query-client` and begins observing
diagnostics only after `app:mounted`. It displays one negative toast per validation source,
summarizing affected records and skipped data. Browser-session reporting tracks diagnostic IDs
together with project ETags. Re-observation, dismissal and navigation do not replay identical
diagnostics; a different ETag removes outstanding old notifications and can notify again.
Diagnostics stay in the query data. The `/status` route (`server/routes/status.ts`) also runs
`prepareProject()` for successful backend responses and exposes the resulting diagnostics as a
top-level `validationErrors` array; if the backend request fails, the field is an empty array
alongside the error details.

## Caveats and performance notes

- **Per-SSR-request re-parse — solved:** the full validation + metadata build runs only when the
  body ETag of `/vicav/project` changes; warm requests are served from the module-scope memo. In
  `nuxt dev` the memo, like the `fetchWithETag` maps, does not persist across the isolated
  dev-server contexts, so the re-parse still happens there.
- **The memo key includes the backend identity**, not only the ETag: two backends can serve the same
  ETag with different bodies.
- **CI identity divergence:** the store derives its backend identity from `config.apiBaseUrl` on the
  server, while `useApiClient` uses `env.public.apiBaseUrl` when `isCI` is set. In CI with a private
  `apiBaseUrl` configured, the two identities differ, so the same upstream body can be memoized
  under two keys.
- **Authenticated requests are never memoized**, so a deployment with `apiUser` re-prepares the
  project on every request.
- **Grouping is not memoized in the store** (see Grouped output); a store-level memo is deferred.
- **Taxonomy merge per item:** `resolveCategory` re-merges the corpus taxonomies for every record,
  so category resolution is O(items × categories) — a candidate for hoisting the merged taxonomy
  into the per-preparation index.
- **Duration parsing** only handles `PT<n>.0S`-shaped `@dur-iso` values.
- **Dead code:** the `placeSettlement` fallback in `resolveLabel` is unreachable.
- **Single-flight race:** the `currentRequests` set/await/delete sequence has a small race window
  where two near-simultaneous callers can both start fetches.
- **`304` without a cached body** throws `Cache error!`; if the upstream stops sending `ETag`, the
  HTTP layer stops caching entirely.
- **Failed init is retryable but not retried:** the store-local `inFlight` guard is cleared once the
  run settles, so a later `initialize()` call would start a fresh attempt — but no caller re-invokes
  `initialize()` after the plugin's single call, so in practice a failed init leaves the store empty
  until the next SSR request / page load.
- **Scope of validation:** only the project static data is validated. Dictionary searches, other API
  responses and user input are outside this pipeline. Cache sharing is process-local, and body ETags
  must identify upstream static-data changes.

## Maintenance Prompt

Use this prompt after changing `app/lib/project/prepare-project.ts`,
`app/stores/use-tei-headers-store.ts`, `app/composables/use-project-info.ts`,
`shared/utils/use-api-client.ts`, `app/plugins/query-client.ts`,
`app/plugins/use-tei-headers-store-init.ts`, `app/types/teiCorpus.ts`, `app/types/project.ts`,
`app/assets/openapi.json`, or generated API client types/enums:

```text
Review app/lib/project/prepare-project.ts end-to-end, including prepareProject(), the parsing
helpers, join logic, memoization, freezing, and exported accessors. Also review
app/stores/use-tei-headers-store.ts (thin wrapper: initialize(), simpleItems, persons, initialization,
getGroupedSimpleItems()), app/composables/use-project-info.ts, shared/utils/use-api-client.ts,
app/plugins/query-client.ts, and app/plugins/use-tei-headers-store-init.ts.
If schema or generated client types changed, also review app/assets/openapi.json, app/lib/api-client,
app/types/teiCorpus.ts, and app/types/project.ts.

Update docs/tei-metadata-loading-caching.md so it accurately documents current implemented behavior.

Include:
- data source shape and where staticData.table is read from
- request/caching pipeline changes (useApiClient customFetch path, fetchWithETag behavior, TanStack query stale/gc/refetch behavior, SSR hydration/dehydration details)
- preparation flow, memoization/idempotency/re-entrancy guards, and error/fallback behavior
- parsing/validation behavior (what is validated, what is skipped/dropped, logging behavior, diagnostics)
- output contracts for the prepared response, simpleItems, persons, and grouped output
- changes to simpleTEIMetadata fields, enum handling, accessors, sorting/grouping/filter behavior
- join logic changes (geo/person/responsibility/category/publication joins)
- dependency/import changes that affect runtime behavior or typings
- any intentional limitations, caveats, or performance-relevant notes

Keep the document concise, structured, and implementation-accurate. Do not change application code.
```
