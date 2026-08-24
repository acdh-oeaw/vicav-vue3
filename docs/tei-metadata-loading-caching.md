# TEI Metadata Loading and Caching

Pinia store (Nuxt `defineStore`, setup style) that loads and normalizes the project's static TEI
corpus metadata, then exposes query-friendly derived data for the UI.

## Data source

- **Input:** `projectData.value?.projectConfig?.staticData?.table ?? []`, where `projectData` is the
  TanStack query data of `useProjectInfo()` (`app/composables/use-project-info.ts`). Per the OpenAPI
  spec, `staticData` is nullable and `table` is an array of
  `oneOf: [Biblio, Geo, TeiCorpus, object]`. The content is **static, project-bundled TEI metadata**
  (TEI/XML-derived JSON conforming to the TEI Guidelines, with GeoNames-backed place references),
  but it **is** fetched at runtime via `GET /vicav/project` through the caching pipeline below.
- **Entry handling:** the store only consumes two entry shapes. Entries with a `TEIs` property are
  treated as `TeiCorpus` and validated; geo envelopes are found by probing `item`, `item.Geo`, and
  `item.TEI` for a `text.body.listPlace` array (the `Geo` schema carries places there). `Biblio`
  entries and other generic objects are silently skipped.
- **Schemas:** Zod validators are built at module top level from the bundled
  `app/assets/openapi.json` via `useOpenapiSchema` (`TeiCorpusSchema`, `TeiSchema`,
  `GeoPlaceSchema`); the composable remaps `#/components/schemas/` refs to `#/$defs/` and returns a
  self-contained JSON schema, which is why the top-level call is safe. TS types come from
  `@/lib/api-client` (auto-generated from the same OpenAPI definition).

## Request pipeline and caching

The project config travels through three layers before it reaches the store. Each layer has a
different scope and TTL. Once in the store, the parsed corpus is additionally memoized across SSR
requests, keyed on the body-level `ETag` of the response (see Initialization below).

```
useProjectInfo()  ──►  useApiClient() / Api.vicav.getProject()  ──►  fetchWithETag (server) | native fetch (client)  ──►  upstream /vicav/project
       │                              │                                              │
       │                              │                                              └─ upstream HTTP cache (driven by Cache-Control / ETag from the API)
       │                              └─ customFetch: server uses fetchWithETag; client uses native fetch
       └─ TanStack QueryClient (one cache entry keyed by ["get-project-info"], 15-min staleTime,
           SSR timestamps bucketed to 3 min, 5-min default gcTime, default focus/reconnect refetch)
```

### Layer 1 — `useApiClient()` (`shared/utils/use-api-client.ts`)

A per-call factory (auto-imported into both the Vue app and Nitro server) that **creates a fresh**
Orval-generated `Api` instance per call, pre-configured for the current runtime; the two
module-level `Map`s below outlive individual `Api` instances:

- Sets `api.baseUrl` on the server from `env.apiBaseUrl`, falling back to `env.public.apiBaseUrl`;
  on the client only `env.public.apiBaseUrl` is considered. With the `nuxt.config.ts` defaults
  (server `apiBaseUrl: undefined`, public `https://vicav-dev.acdh.oeaw.ac.at`) **both** runtimes end
  up on the public dev URL; the Orval default `http://localhost:8984` only applies when both env
  values are unset.
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
   `X-Cache-Expires: <ISO>` (no other headers — no `ETag`/`Content-Type`; the generated client
   parses the body as JSON regardless). No network call.
2. **Single-flight de-dup:** if a request to the same URL is already in flight, the second caller
   awaits the same `Promise` from `currentRequests` rather than issuing a parallel fetch (protects
   against healthy-check storms against a slow backend).
3. **Conditional GET with ETag:** otherwise, perform a `GET` carrying
   `If-None-Match: <previous ETag>` (the trailing `--gzip` suffix is stripped before sending, since
   the upstream signs the gzipped body).
4. **TTL from `Cache-Control`:** `max-age` is parsed from the response (`maxAge > 0 ? maxAge : 5`
   seconds; defaults to 5 s when the header is missing). The entry's `expiresAt` is set to
   `now + maxAge`; a one-shot `setTimeout` then calls `deleteFromCacheIfExpired` after `2 * maxAge`,
   which only deletes the entry if it is expired by then (a `304` refresh in the meantime extends
   `expiresAt` and turns the pending reap into a no-op).
5. **`304 Not Modified`:** refresh the cached body's `expiresAt` to `now + maxAge` and return a
   `200` with the existing bytes. Throws `Cache error!` if there is no cached body to fall back to.
6. **`200 OK`:** if the response carries an `ETag` header, the body is stored **as opaque bytes**
   (`new Uint8Array(await response.clone().arrayBuffer())` — no JSON re-parse/re-serialize) and the
   original `Response` is returned untouched. Responses without `ETag` are returned but not cached.
7. **Error fallback:** on a thrown error, the in-flight entry is removed and the cached body is
   returned as a `200` with a console warning. If no cached body exists, the error is wrapped and
   rethrown.

Server-only caveats:

- The cache is per Nitro process, keyed on URL only (path + query); credentials are not part of the
  key (fine in practice — the app is configured with a single `apiUser`/`apiPass`). The module
  comment notes that in the Nuxt dev server the API routes and frontend live in isolated contexts,
  so the global `cache` does not persist across them in dev; in `nuxt build`/production, you get a
  single shared global.
- Method is implicitly `GET` (the comment in the file explicitly says "The rest of the code at the
  moment only works for GET requests.").
- A small race exists in the single-flight map (set / await / delete) — two near-simultaneous
  callers after the first deletion can both start fetches.
- If the upstream stops sending `ETag`, this layer effectively stops caching (the entry is never
  written). Without `Cache-Control: max-age`, the effective server-side TTL is 5 seconds.

### Layer 2 — TanStack `QueryClient` (`app/plugins/query-client.ts`)

`useProjectInfo(options?)` wraps
`useQuery({ queryKey: ["get-project-info"], enabled: options?.enabled, ... })` with no other
per-query overrides, so the cache entry inherits the global defaults set by the `query-client` Nuxt
plugin. The `enabled` option is currently unused by every caller (including the store), so the query
is always enabled:

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
  timestamps to a 3-minute bucket** before serializing (nearest multiple of `3 * 60 * 1000`). Quirk:
  `errorUpdatedAt` is computed from `dataUpdatedAt` (not its own value), and `dehydratedAt` is
  floored as well.
- On the **client**, in `app:created`, the plugin calls `hydrate(queryClient, state.value)` to
  rehydrate.
- **Plugin ordering:** Nuxt runs `app/plugins` in file order, so `query-client.ts` registers its
  `app:created` hydration hook before `use-tei-headers-store-init.ts` does; on the client the cache
  is hydrated **before** the store's `initialize()` runs, and `suspense()` resolves from the
  hydrated cache without a network round-trip.

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
2. Otherwise an `If-None-Match` GET is issued; on `304` the body is served from the cache (and
   `expiresAt` is refreshed); on `200` with `ETag` the body is stored as opaque bytes and a one-shot
   reap is scheduled for `2 * maxAge` later. The effective server-side TTL for `/vicav/project` is
   the upstream's `Cache-Control: max-age` (or 5 s by default).
3. The TanStack `QueryClient` then caches the parsed `data` for the rest of the SSR pass and
   dehydrates it for the client.

## Data model

### Input types

- **`TeiCorpus`** — top-level container with `@id`, `teiHeader`, a `TEIs[]` array, and optional
  `standOff.listPerson`.
- **`TEI`** — individual TEI document with `teiHeader.fileDesc` (titleStmt, respStmts,
  publicationStmt, sourceDesc.recordingStmt, sourceDesc.biblStruct), `teiHeader.profileDesc`
  (particDesc.listPerson, settingDesc.place, textClass.catRefs, langUsage), and
  `teiHeader.encodingDesc.classDecl.taxonomies`. Attributes `@id`, `@type` (const `"recording"`),
  and `@hasTEIw` (only `"true"` occurs; absence means no TEI-W transcription).
- **`GeoPlace`** — geographic place with `@id`, `@type` (`"geo" | "reg" | "diaGroup"`; only `"reg"`
  maps to the region hierarchy level), prefLabel/standard/local place names, `geoNames_idno`, nested
  `location.country` (`@key` + `$`).
- **`Person`** — corpus-level participant (`@id`, `@sex` (`"f"|"m"|"missing"`) / `sex.$`
  (`"F"|"M"|"D"`), `@age`, `birth` with `$`/`date`).
- **`Author` / `AuthorRef`** — distinguished at runtime by simple type guards: `persName` has `@id`
  (full `Author`) vs `@ref` (`AuthorRef`); no Zod validation here.
- **`RespStmt`** — links a `persName` (author or ref) to a `Responsibility` enum value.

### Enums

- `Responsibility` — the generated enum has ~25 members; the store only consumes the five in
  `supportedResponsibilities` (`Author`, `Recording`, `Principal2`, `Transcription1`,
  `TransferToELAN`); all other `respStmt`s are ignored.
- `BiblStructType` — the generated enum has 13 members; only `BookSection`, `JournalArticle`, and
  `Thesis` drive a publication shape, everything else falls back to the empty publication.
- `Unit` — `Page`, `Volume`, `Issue`; the store uses `Page` and `Volume` to extract `biblScope`
  values.
- `DataTypesEnum` — high-level data type (e.g., `CorpusText`, `Feature`, `Profile`); mapped from the
  raw collection name via `@/config/dataTypes` (`resolveDataType`; unknown collections → `"Text"`).

### Output types

- **`rawItems: TeiCorpus[]`** — validated corpora with their inner `TEIs[]` re-validated.
- **`simpleItems: simpleTEIMetadata[]`** — flat per-TEI record (see fields below).
- **`persons: Person[]`** — corpus-level participant list extracted from the entry with
  `@id === "vicav_corpus"`.

When served from the ETag memo (the common case on a warm process), all three outputs are shared by
reference across SSR requests, `markRaw`'d (no Vue reactive Proxy wraps them), and deeply frozen —
see Initialization. The public ref types intentionally remain the mutable types; the immutability
guarantee is enforced at runtime (and at compile time inside the store module, via
`ReadonlyDeep<CacheEntry>`).

### `simpleTEIMetadata` fields

- `id` — first `publicationStmt.idno.$` (no type filtering; the code comment notes the wanted idno
  has a type ending in `CorpusID`, but only one idno is considered), falling back to `TEI.@id`, then
  `"no_id"`
- `recordingDate` — `recording.date["@when"]` (a string in practice; the schema union with `TeiDate`
  is never produced by the store, but the `recordingDate` accessor handles both shapes)
- `pubDate` — `publicationStmt.date.$`, falling back to `"unknown"`
- `dataType` — resolved via `dataTypes` config (unknown collection → `"Text"`)
- `label` — precedence: `CorpusText` → first TEI title; else first person's name (even if empty);
  else first TEI title; else `@id` → `idno.$` → `"no_id"`. (The trailing `placeSettlement` branch in
  `resolveLabel` is unreachable.)
- `title` — first TEI title, suffixed ` – <first person name>` when a named person exists; falls
  back to `label` when there is no title
- `author`, `recording`, `principal`, `transcription`, `transfer to ELAN` — arrays of
  `{given, family}` for the five supported responsibilities, resolved against corpus-level
  `respStmts` (missing entries → `[]`)
- `place` — `{settlement, country, region}`; inline TEI `settingDesc.place` values win, gaps are
  filled from the GeoPlace index lookup
- `person` — array of `{name, sex, age, dob}` joined from corpus `listPerson`; fallbacks
  `sex: @sex ?? sex.$ ?? "n/a"`, `age: @age ?? "n/a"`, `dob: birth.$ ?? birth.date.$ ?? "n/a"`
- `resp` — for `CorpusText` without `recording.respStmt`: `"Unknown"`; otherwise resolved from
  `recording.respStmt.persName` (or `recording.p.$`): with corpus metadata, the matching corpus
  `respStmt`'s author display name, falling back to the `corpus:`-stripped `@ref`; without corpus
  metadata, the stripped `@ref`; a non-ref `persName` yields `""`. (The
  `"Recording record malformed"` sentinel is never returned.)
- `category` — taxonomy category name, only for `CorpusText` (else `""`); first `catRef.@target`
  matched against merged corpus taxonomies; `"Unknown"` when there is no header or no match
- `duration` — `HH:MM:SS` (hours part only when non-zero) from `@dur-iso`; parsing is `parseInt`
  after stripping `PT` and `.0`, so only `PT<n>.0S`-shaped values are handled — the OpenAPI examples
  also include `"03:00"` (MM:SS), which would misparse to `3`
- `audioAvailability` — from `availability.@status`; `Feature`/`Profile` and items without duration
  are forced to `"restricted"`; default `"unknown"`
- `@hasTEIw` — normalized: `"true"` only when the raw attribute is exactly `"true"`, else `"false"`
- `teiHeader` — raw header preserved; validated by `z.custom<TeiHeader>()` (pass-through, no checks)
- `publication` — CSL-like metadata; `refType` is always `"external"`; `type` is `"chapter"`
  (`bookSection`), `"journalArticle"`, `"book"` (for `thesis`), or `""` (unmapped/missing
  `biblStruct`); `bibl` carries
  author/editor/title/container-title/issued/publisherPlace/volume/page

### Grouped output

`getGroupedSimpleItems(options)` returns a 4-level nested object:

```
country → region → place(settlement) → dataType → simpleTEIMetadata[]
```

- Filtered by `options.dataTypes` (allow-list) and optional `options.filterListBy` (strict string
  equality via the accessor's `getValue`).
- Sorted at every level using a numeric-aware `Intl.Collator` (module-scoped, reused); the default
  compare is by `label`; sorting is non-mutating (`toSorted`).
- Items with missing geo fields land in the `""` bucket at the respective level.
- Not memoized in the store: every call re-filters, re-sorts, and rebuilds the tree. The current
  single call site wraps the result in a Vue `computed`; a store-level memo is a deferred plan.

### `simpleMetadataAccessors`

Declarative metadata describing each presentable field (`id`, `label`, `title`, `dataType`,
`category`, `recordingDate`, `resp`, `duration`, `audioAvailability`, `@hasTEIw`, `country`,
`region`, `settlement`) with its display label, value extractor, and
`filterable`/`groupable`/`sortable` flags for UI components.

## Initialization

### Trigger — `app/plugins/use-tei-headers-store-init.ts`

- **Server:** the plugin awaits `teiHeadersStore.initialize()` directly, so the SSR render blocks
  until the project data is fetched and parsed. A rejected init fails the render (the query error is
  logged server-side by the `query-client` plugin's `onError`).
- **Client:** the plugin hooks `app:created` (after the `query-client` hydration hook, see Layer 3)
  and awaits `initialize()` there; the framework does not wait for it, so components reading the
  store see empty arrays until init resolves.
- Components never call `initialize()` themselves; they only read the store's refs.

### Idempotency and error semantics

Three guards, at two scopes:

- **Same-instance re-entrancy (store-scoped):** a `let inFlight` in the store setup makes concurrent
  `initialize()` calls on the same store instance share a single execution. It is cleared in a
  `finally` once the run settles, so a rejected init (e.g. the project query failing) is
  **retryable**: the next `initialize()` call starts a fresh attempt. (Before the ETag memo, the
  promise was never reset and a failure was permanent for the lifetime of the store instance.)
- **Parsed-corpus memo (module-scoped):** `parsedCorpusByEtag` maps the body-level `ETag` of the
  `/vicav/project` response to the fully parsed `{ rawItems, simpleItems, persons }`. The ETag
  changes only when the upstream body changes, so warm SSR requests skip the entire parse pipeline.
  The map is a bounded LRU (cap 4, insertion-order eviction) so unexpected upstream ETag churn
  cannot grow it without bound.
- **Cross-request parse dedup (module-scoped):** `inFlightParses` maps an ETag to its in-flight
  parse promise. On a cold miss — most importantly right after a deploy — the first request
  registers its parse promise before awaiting it, and concurrent requests for the same ETag await
  that promise instead of each running the full pipeline. Entries are removed in a `finally` on
  settle (success or failure), so the map is empty except while a parse is actually running.
- If the response carries no `ETag`, both module-scope maps are bypassed and the store falls back to
  per-request parsing (the pre-memo behavior), logging a single `console.warn` per process
  (`hasWarnedMissingEtag`).
- If `staticData` or `table` is missing, `?? []` yields empty `rawItems`/`simpleItems`/`persons`
  without error.

### Steps (cold miss; a memo hit skips steps 3–7 entirely)

1. Awaits `useProjectInfo().suspense()`.
2. Reads `envelope = projectData.value` and `etag = envelope?.ETag`. On a memo hit for `etag`, the
   cached entry is assigned to the refs and the call returns; on an in-flight-dedup hit, the pending
   parse promise is awaited and its result assigned instead.
3. Reads `projectConfig.staticData.table ?? []`.
4. Validates entries **asynchronously in parallel** (`safeParseAsync` + `Promise.all` — a deliberate
   perf win for large corpora): each entry with a `TEIs` property is validated with
   `TeiCorpusSchema`, then every `TEIs[i]` with `TeiSchema`. Failures are logged via `console.error`
   with `@id` context (corpus and/or TEI level) but do not abort the load; the failing item is
   dropped. Non-corpus entries are skipped silently.
5. Parses geo envelopes from the same table: probes `item`, `item.Geo`, `item.TEI` for a
   `text.body.listPlace` array (first candidate wins) and validates each place with
   `GeoPlaceSchema`; invalid places are dropped **silently** (no log).
6. Builds `simpleItems` via `buildSimpleItems(parsedRawItems, parseGeoItems(table))` — for each TEI,
   resolves duration, settlement, persons, responsibilities, label, title, category, audio
   availability, and publication metadata; resolves geographic info by joining a `geoPlaceIndex`
   against `sameAs` refs in `settingDesc`/`langUsage`; finally validates each assembled record
   against `SimpleTEIMetadataSchema`. Invalid records are dropped **silently** (no log).
7. Populates `persons` from the corpus-level `listPerson` of the `vicav_corpus` entry (`[]` if that
   entry is missing or failed validation).
8. Writes the assembled `{ rawItems, simpleItems, persons }` to the memo: `markRaw()` on the three
   root collections first (`markRaw` defines the non-enumerable `__v_skip` property and would throw
   on an already frozen object), then a recursive `Object.freeze` (`deepFreeze`, which skips
   already-frozen subtrees — `persons` points into the `rawItems` corpus tree and every
   `simpleTEIMetadata.teiHeader` is embedded by reference — and uses a `WeakSet` guard against
   circular references). Freezing happens exactly once, at cache-write time; memo hits and
   in-flight-dedup hits hand out the frozen references as-is, and Vue reactivity triggers are
   suppressed when the reference is unchanged. Any future in-place mutation of store-derived data
   throws a `TypeError` in strict mode instead of silently corrupting state shared across concurrent
   SSR requests. If the response had no `ETag`, steps 3–7 still run, but nothing is frozen or
   cached.

## Joins performed

- **Corpus metadata** — the validated `TeiCorpus` with `@id === "vicav_corpus"` provides the
  canonical `respStmts`, `listPerson`, and `taxonomies` referenced by individual TEIs. If it is
  missing (absent or failed validation), `persons` is `[]`, `category` is `""`/`"Unknown"`,
  responsibility arrays are empty, and `resp` falls back to the stripped `@ref`.
- **Geo join** — `normalizeGeoReference` strips a `geo:` prefix (case-insensitive), diacritics
  (NFD), whitespace/underscores/dashes, and lowercases. The index `Map` is keyed on `@id`, all
  place-name variants (prefLabel/standard/local), and `geoNames_idno`. TEIs look up by any of
  `settingDesc.place.@sameAs`, `settingDesc.setting.placeName.@sameAs`, or
  `langUsage.language.settingDesc.listPlace.place.@sameAs` (first hit wins). `@type === "reg"`
  places fill the `region` slot, all others fill `settlement`; `country` comes from
  `location.country.$`.
- **Person join** — TEI `listPerson[].@sameAs` (falling back to the node's `$` text), with the
  `corpus:` prefix stripped, matched against corpus `listPerson[].@id`.
- **Responsibility join** — TEI `respStmts[].persName.@ref` matched against corpus
  `respStmts[].persName.@ref` (both sides must be `@ref` objects); the matched corpus `persName` is
  then read as a full `Author` to extract `forename`/`surname` (or `name` → `given` with empty
  `family`; otherwise `{given: "", family: ""}`). `Author`/`AuthorRef` discrimination uses
  lightweight structural type guards (`isAuthor`/`isAuthorRef`, own `@id` vs `@ref`) rather than Zod
  `safeParse` — per-call Zod validation there was measurably slower for large corpora, so the old
  `AuthorSchema`/`AuthorRefSchema` validators were removed (only `TeiCorpusSchema`, `TeiSchema`, and
  `GeoPlaceSchema` remain Zod-backed).
- **Category join** — first `catRef.@target` (with `corpus:` stripped) matched against the merged
  corpus `taxonomies.categories[].@id`; the name comes from `catDesc.name.$`, falling back to
  `catDesc.$`.
- **Publication shape** — driven by `biblStruct.@type` (`bookSection` → `"chapter"`,
  `journalArticle` → `"journalArticle"`, `thesis` → `"book"`); anything else yields the empty
  external publication. `volume`/`page` come from `monogr.imprint.biblScopes` matched by `@unit`.

## Dependencies

### Direct imports

- `type-fest` (type-only) — `ReadonlyDeep<T>` for the memo's internal cache-entry type.
- `zod` (as `* as z`) — `z.fromJSONSchema`, `z.ZodType`, `z.ZodError`.
- `@/config/dataTypes.ts` — the `dataTypes` map; used by `resolveDataType` to map a collection name
  to a `DataTypesEnum` value.
- `@/lib/api-client` — types/enums: `Author`, `AuthorRef`, `BiblStructType`, `GeoPlace`, `Person`,
  `Responsibility`, `RespStmt`, `Taxonomy`, `TEI`, `TeiCorpus`, `TeiHeader`, `Unit`.
- `@/types/global.ts` — `DataTypesEnum`.
- `@/types/teiCorpus.ts` — `simpleTEIMetadata` type and `SimpleTEIMetadataSchema` Zod validator.

### Auto-imported (Nuxt/unimport)

- `defineStore` from Pinia.
- `ref`, `markRaw` from Vue.
- `useOpenapiSchema` (`app/composables/use-openapi-schema.ts`) — a pure function over the bundled
  `app/assets/openapi.json` (remaps `#/components/schemas/` refs to `#/$defs/`); called at module
  top level to build the Zod validators.
- `useProjectInfo` (`app/composables/use-project-info.ts`) — provides
  `projectData.value.projectConfig.staticData.table` and the `suspense()` promise. Wraps `useQuery`
  against `["get-project-info"]`; inherits the 15-minute `staleTime` and SSR hydration from
  `app/plugins/query-client.ts`.
- `useApiClient` (`shared/utils/use-api-client.ts`, auto-imported into both the Vue app and the
  Nitro server via Nuxt's generated `.nuxt/imports.d.ts`) — creates an Orval `Api` instance with the
  runtime-configured base URL, optional basic-auth `securityWorker`, and a `customFetch` that is
  `fetchWithETag` on the server (ETag-conditional GET layer backed by two module-level `Map`s; TTL
  from upstream `Cache-Control: max-age`, default 5 s; one-shot reap after `2 * maxAge`) and the
  native `fetch` on the client.

### Transitive

- `pinia`, Vue 3 reactivity.

## Caveats and performance notes

- **Per-SSR-request re-parse — solved:** the full validation + metadata build now runs only when the
  body-level `ETag` of `/vicav/project` changes; warm requests are served from the module-scope memo
  (see Initialization). In `nuxt dev` the memo, like the `fetchWithETag` `Map`s, does not persist
  across the isolated dev-server contexts, so the re-parse still happens there.
- **Grouping is not memoized in the store** (see Grouped output); a store-level memo is deferred.
- **Dev-server context isolation:** in `nuxt dev` the API routes and the frontend run in isolated
  contexts, so the `fetchWithETag` `Map`s do not persist across them; production builds share one
  global scope.
- **Single-flight race:** the `currentRequests` set/await/delete sequence has a small race window
  where two near-simultaneous callers can both start fetches.
- **`304` without a cached body** throws `Cache error!`; if the upstream stops sending `ETag`, this
  layer stops caching entirely.
- **Failed init is retryable but not retried:** the store-local `inFlight` guard is cleared once the
  run settles (see Initialization), so a later `initialize()` call would start a fresh attempt — but
  no caller re-invokes `initialize()` after the plugin's single call, so in practice a failed init
  still leaves the store empty until the next SSR request / page load.
- **Duration parsing** only handles `PT<n>.0S`-shaped `@dur-iso` values (see `duration` field).
- **Dead code:** the `placeSettlement` fallback in `resolveLabel` and the
  `"Recording record malformed"` sentinel in `resolveRecordingResponsibilityName` are unreachable.
- **Hydration quirk:** `errorUpdatedAt` is derived from `dataUpdatedAt` (see Layer 3).

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
