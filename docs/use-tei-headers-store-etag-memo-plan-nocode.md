# Implementation plan: body-ETag memo for `useTeiHeadersStore`

This plan was written in 2026-08 using MinMax M3. It was reviewed as an exercise using

- Gemini 3.7 flash (found problems and suggested improvements)
- Claude Sonnet 5 (found problems and suggested improvements)
- GPT-5.3 Codex (found nothing supstatial)

## Goal

Eliminate the per-SSR re-parse of the TEI corpus when the upstream body has not changed. The parse
is the dominant per-request cost on `/`; the upstream `GET /vicav/project` is already cheap (~100 ms
warm via `304`, ~580 ms cold with a 6.4 MB body) thanks to the existing `fetchWithETag` cache. The
remaining cost is the Zod validation, the geo index build, the per-TEI `extractMetadata` work, and
the `buildSimpleItems` reduce — all of which run per SSR render even though the upstream body is
unchanged.

## Why this works

The upstream `/vicav/project` JSON response carries a top-level
`ETag: "06159BEA03100E45F72300A8FD7F7021"` (32-char hex, identical to the HTTP `ETag` header).
Verified live on 2026-08-21 against `https://vicav-dev.acdh.oeaw.ac.at/vicav/project`. The OpenAPI
schema documents this field at `app/assets/openapi.json:6023` and the spec's own
`project_config_VICAV` example includes it at `app/assets/openapi.json:2044`. The ETag is a content
hash that changes only when the body changes — the exact invalidation signal we need. Because the
ETag travels with the parsed body, it is observable in every Nitro context, including the dev-mode
context split that affects the HTTP-header ETag in `shared/utils/use-api-client.ts`.

## Scope

Exactly one file: `app/stores/use-tei-headers-store.ts`. No other files change.

- `app/composables/use-project-info.ts` — unchanged. The body-level `ETag` is already on
  `response.data.ETag`; consumers continue to get the full `ProjectConfig` envelope.
- `app/plugins/use-tei-headers-store-init.ts` — unchanged. Still calls `initialize()` per SSR
  request.
- `shared/utils/use-api-client.ts` — unchanged. The `fetchWithETag` layer is orthogonal to this
  change.

## What to change in `use-tei-headers-store.ts`

Adds one import: `import type { ReadonlyDeep } from "type-fest";` (already a project dependency —
see §1b). No other new imports or dependencies.

### 1. Add a bounded memo (module scope, above the `defineStore` call)

A module-scope `Map` keyed on the body-level ETag, with values holding the parsed `rawItems`,
`simpleItems`, and `persons`. Bounded to a small constant (default: 4) via insertion-order LRU
eviction.

Why an LRU cap instead of relying on V8 GC: a module-scope `Map` is a live root, and from the Map's
perspective every entry it holds is reachable. V8 does not collect Map entries based on age or
access frequency. Without a cap, unexpected upstream ETag churn would grow the map without bound.

Memory considerations: each cached entry retains parsed `rawItems` and `simpleItems` (which embed
the full TEI headers). In steady state, only 1 entry is live (the current upstream deployment hash).
A conservative cap of 4 retains sufficient headroom for rolling deploys without accumulating
significant multi-generation corpus memory in long-running Node worker processes.

The LRU uses insertion-order iteration, which `Map` provides natively:

- **Hit path**: `delete` then `set` the key to move it to the most-recent position. (A plain `set`
  on an existing key updates the value without reordering).
- **Miss/store path**: `delete` then `set` to guarantee most-recent position, then if `size > CAP`,
  evict the oldest entry via `map.delete(map.keys().next().value!)`.

Implement this using small inline module-scoped helpers (e.g. `getCached` and `setCached`) directly
in `app/stores/use-tei-headers-store.ts`.

### 1a. Shared-reference safety: `markRaw` + recursive deep-freeze at write time

Once a cache entry is stored, its `rawItems`/`simpleItems`/`persons` are no longer private to one
SSR request — they are handed out, by reference, to every subsequent request that hits the memo for
the same ETag, potentially concurrently. This is a behavior change from today, where every request
gets its own freshly parsed, private copy. Two safeguards are required at write time (i.e., inside
`setCached`, once per cache entry — not per read) and must execute in strict order:

- **`markRaw()` must be called BEFORE `deepFreeze()`**: `markRaw()` sets a non-enumerable
  `__v_skip: true` property on the target object. If called on an already frozen object, it throws a
  `TypeError: Cannot add property __v_skip, object is not extensible`. Therefore, apply `markRaw()`
  on the top-level `rawItems` and `simpleItems` arrays first. Without `markRaw()`, every SSR request
  that assigns the same raw array into `ref.value` causes Vue to wrap it in — and share — the same
  reactive Proxy (Vue caches proxies per-target object in a global `WeakMap`), which adds
  unnecessary reactive-tracking overhead on read-only snapshot data and risks cross-request
  subscriber leakage.
- **Recursive (deep) `Object.freeze`** of `rawItems`, `simpleItems`, and `persons` — every nested
  object and array, not just the top-level array — after `markRaw()` and before the entry is written
  into the memo. This converts the "no consumer currently mutates this data" property (true today,
  but only a convention) into a language-enforced invariant: any future code that attempts
  `item.x = y`, `.push()`/`.sort()`/`.splice()` on a nested array, or `Object.assign(target, ...)`
  on one of these objects will throw a `TypeError` in strict mode (ESM modules are strict by
  default) instead of silently corrupting state shared across concurrent, unrelated SSR requests.
  This is a materially worse bug class than today's status quo (private-copy waste), so enforcement
  — not just convention — is required once references are shared.

**Verified safe by audit (2026-08-21):** a full repo-wide search of every consumer of
`useTeiHeadersStore()` (`rawItems`, `simpleItems`, `persons`, and every nested field — `teiHeader`,
`place`, `person`, `publication`, `author`, `TEIs`, etc.) found zero cases of direct property
assignment, nested-array mutation methods, `Object.assign` onto store-derived objects, `delete`,
unsafe spread-then-mutate patterns, or `v-model` bindings into this data anywhere in the codebase.
All consumers only `.find()`/`.filter()`/`.map()`/template-read, or construct genuinely new objects.
The store's own `buildSimpleItems`/`extractMetadata` pipeline was also confirmed to only _read_ from
`rawItems`-derived objects while building `simpleItems` (it embeds a `teiHeader` reference into new
object literals, which is fine — embedding-by-reference is not mutation), so there is no internal
"mutate then re-read" dependency that a frozen `rawItems` would break on a later cache hit. The one
third-party library touching this shape of data (`citation-js`) deep-copies its input internally
before any use, and is in any case only ever given a freshly constructed plain object by
`ui/citation.vue`, never a direct reference into store data. Deep-freezing is therefore safe against
the current codebase; it is a forward-looking guard, not a workaround for an existing violation.

**Why deep-freeze instead of copying cached entries on every read:** copying (shallow or deep) was
considered as an alternative — giving each request its own private array/objects on every memo hit,
exactly replicating today's per-request-isolation semantics. Rejected because:

- A **shallow copy** (`.slice()` on the top-level array) only protects against top-level array
  mutation; it does nothing for the nested `teiHeader`/`person`/`place`/`publication` objects, which
  is where most plausible future mutation risk actually lives — so it gives a false sense of safety
  without a corresponding deep-audit.
- A **deep copy** (`structuredClone` or equivalent) sufficient to actually isolate every level would
  re-allocate the full parsed corpus (rawItems/simpleItems, which embed full TEI headers, on the
  order of several MB) on **every single cache hit** — i.e., on the vast majority of production
  requests once warm. That cost is paid repeatedly, forever, and could plausibly erode a large
  fraction of the savings this whole change exists to capture.
- Deep-freeze, by contrast, is paid once per cache **write** (an infrequent event — once per new
  ETag, not once per request) and is an O(1) reference handout on every read. It also fails loudly
  (`TypeError`) at the exact point a future violation would occur, rather than letting each request
  silently diverge into its own private, inconsistent mutated copy — copying trades a correctness
  guarantee for a performance cost and still doesn't manifest a bug report when the underlying
  assumption is violated.

Implement the deep-freeze as a small recursive helper (e.g.
`deepFreeze(value: unknown, seen = new WeakSet()): void`) that walks plain objects and arrays and
calls `Object.freeze` bottom-up. It should skip already frozen objects (`Object.isFrozen(value)`) to
avoid redundant traversals, only process non-null objects/arrays, and use `seen` as a defensive
guard against potential circular references.

### 1b. Type-level enforcement: `ReadonlyDeep<T>` from `type-fest`

The `Object.freeze`/`markRaw` in §1a is a _runtime_ guarantee only — it throws `TypeError` if
violated, but only when the offending code actually executes. To catch violations earlier, at
compile time / in CI, type the cache's internal storage using `type-fest`'s `ReadonlyDeep<T>`
utility type (`type-fest` is already a project dependency — no new dependency added).
`ReadonlyDeep<T>` recursively marks every nested property and array as `readonly`, which mirrors the
depth of the runtime deep-freeze (unlike TypeScript's built-in `Readonly<T>`, which is shallow and
would not catch `item.teiHeader.fileDesc = ...`-style nested mutation attempts at the type level).

Scope of the type change is intentionally narrow, matching the plan's single-file constraint:

- Type the memo's value type as
  `ReadonlyDeep<{ rawItems: Array<TeiCorpus>; simpleItems: Array<simpleTEIMetadata>; persons: Array<Person> }>`
  (i.e. `ReadonlyDeep<CacheEntry>` if `CacheEntry` is extracted as a named type), and type
  `inFlightParses` as `Map<string, Promise<ReadonlyDeep<CacheEntry>>>` to match.
- `getCached`/`setCached` and the `deepFreeze` helper operate on this `ReadonlyDeep<CacheEntry>`
  type, so any attempted mutation _inside_ `use-tei-headers-store.ts` itself (e.g. an accidental
  in-place edit during `setCached`, or in a future refactor of the parse pipeline) is a compile
  error, not just a runtime throw discovered later.
- **Not in scope**: changing the public return types of `rawItems`, `simpleItems`, `persons` (still
  `Ref<Array<TeiCorpus>>`, `Ref<Array<simpleTEIMetadata>>`, `Ref<Array<Person>>` as today) or any
  consumer-facing prop/parameter types across the ~13 components identified in the mutation audit.
  Propagating `ReadonlyDeep<T>` all the way to consumers would give compile-time protection at every
  call site too, but requires updating prop/parameter types wherever this data is passed (e.g.
  `<Citation :header>`), which conflicts with this plan's "exactly one file" scope. Treat
  consumer-facing `ReadonlyDeep<T>` propagation as optional future hardening, not part of this
  change.
- At the point refs are assigned on a hit (`rawItems.value = cached.rawItems`), a type assertion
  back to the plain (non-`ReadonlyDeep`) type is expected and acceptable, since the public ref types
  are intentionally left unchanged per the previous bullet — the readonly guarantee still holds at
  runtime via the deep-freeze in §1a, only the compile-time enforcement is scoped to the internal
  cache boundary.

### 2. Add an in-flight guard for concurrent initializations

Two separate dedup problems exist here, at two separate scopes. They must not be conflated:

- **Single-request/single-instance re-entrancy (store-local)**:
  `let inFlight: Promise<void> | null = null` inside the `defineStore` setup closure replaces
  `initializationPromise`. Because Pinia setup stores in Nuxt SSR are instantiated per-request, this
  local variable only guarantees that multiple concurrent `initialize()` invocations within the
  _same_ request/store instance share a single execution. **It provides no dedup whatsoever across
  different requests**, since each SSR request gets its own store instance and therefore its own
  `inFlight` variable.
- **Cross-request in-flight-parse deduplication (module-scope, required)**: When the memo (§1)
  misses — most importantly, right after a deploy when a new ETag first appears — multiple
  concurrent SSR requests can each independently reach the parse step for the _same_ new ETag before
  any of them has finished writing to the memo. `fetchWithETag`'s `currentRequests` map only dedupes
  the upstream _network fetch_; it does nothing to prevent every one of those requests from
  separately running the full Zod validation / geo index / `buildSimpleItems` pipeline once they
  each have the (shared) response body in hand. That redundant-parse race is exactly the CPU spike
  this plan sets out to avoid, and it is worst at the worst possible time (a fresh deploy, under
  live traffic). Preventing it requires a **second module-scope map**, keyed by ETag, holding the
  in-flight parse `Promise` itself:

  ```
  const inFlightParses = new Map<string, Promise<CacheEntry>>();
  ```

  This map is populated only _after_ `suspense()` resolves and `etag` is known (it cannot be keyed
  before that point). The first request to miss the memo for a given `etag` registers its parse
  promise here before awaiting it; every other concurrent request that misses the memo for the
  _same_ `etag` finds the pending promise and awaits it instead of starting its own parse. The entry
  is removed in a `finally` once the parse settles (success or failure), and on success the result
  is also written into the memo (§1).

  This map is distinct in scope, lifetime, and purpose from the memo in §1: the memo (Map A) is a
  long-lived bounded result cache; this map (Map B) is a short-lived dedup structure that only ever
  holds entries for ETags currently being parsed, and is empty the rest of the time.

### 3. Rewrite `initialize()` to combine the single-flight and the memo

The new body:

1. If the store-local `inFlight` is set (same-instance re-entrancy), await it and return.
2. Otherwise, set `inFlight` to an async IIFE that: a. Awaits `suspense()` once. b. Reads
   `envelope = projectData.value` and `etag = envelope?.ETag`. c. **Memo check (Map A)**: if `etag`
   is present and the memo has it: read the cached `rawItems` / `simpleItems` / `persons`, touch the
   entry in the LRU (delete-then-set), assign the references to the reactive `ref`s, and return. d.
   **In-flight-parse check (Map B, module-scope)**: otherwise, if `etag` is present and
   `inFlightParses` already has a pending promise for it, `await` that promise and assign its
   resolved `rawItems` / `simpleItems` / `persons` to the reactive `ref`s. No parse is performed by
   this request. e. **Cold miss**: otherwise, register a new promise in
   `inFlightParses.set(etag, parsePromise)` _before_ awaiting it (so concurrent callers arriving
   during the parse take branch (d) instead of racing), then parse fresh (the existing parse flow —
   Zod validation, geo index build, `buildSimpleItems`, `extractPersonList`), assign to the reactive
   `ref`s, and if `etag` is present, write the result to the memo via the LRU helper
   (delete-then-set + cap check). Guarantee removal of the entry from `inFlightParses` in a
   `finally` block once the parse settles (on success or failure), so errors don't leave permanent
   stuck promises. If `etag` is missing on an otherwise valid response, skip both maps and log a
   defensive `console.warn` strictly once across the process lifetime using a module-level
   `let hasWarnedMissingEtag = false` guard.
3. Await `inFlight` inside a `try / finally` that clears `inFlight` on completion.

### 4. Why the hit path is O(1) end-to-end

The hit path bypasses all Zod schema validation, geo index construction, `extractMetadata`
transformations, and `buildSimpleItems` reductions. It executes only `Map` lookups/touches and three
reference assignments to Vue `ref`s (`rawItems.value = cached.rawItems`, etc.). If the ref value
reference is unchanged, Vue reactivity triggers are suppressed.

### 5. Things to preserve

- The existing return contract of `initialize()`: idempotent, returns `Promise<void>`, ready when
  awaited.
- The existing call site in `app/plugins/use-tei-headers-store-init.ts` does
  `await teiHeadersStore.initialize()` — keep that working.
- The existing local helper functions (`parseRawItems`, `parseGeoItems`, `buildSimpleItems`,
  `extractPersonList`, `findCorpusMetadata`) — do not refactor.
- The freshly parsed result must be fully constructed, then passed through `markRaw()` on root
  collections, and finally recursively passed through `deepFreeze()` before being placed in the
  cache or assigned to reactive refs (i.e., freeze only the completed object). Freezing must not
  happen on the objects mid-construction, and must not be applied to `rawItems`/ `simpleItems` more
  than once (the freeze helper should only ever run on a cache write, never on a memo hit or an
  in-flight-parse-map hit).

## Verification

1. **Cold-process first request** — pays the initial parse cost and populates the module-scope memo
   under the body's ETag.
2. **Subsequent requests on a warm process (same upstream body)** — hits the memo, skips all Zod
   validation and parsing loops, and populates the store's refs in sub-millisecond time.
3. **N concurrent cold requests for the same new ETag (deploy scenario) — required test**: fire
   several concurrent `initialize()` calls from separate store instances (simulating separate SSR
   requests) against a mocked `useProjectInfo` returning the same new ETag, and assert the parse
   pipeline (e.g. `buildSimpleItems`) is invoked exactly once, with all callers resolving to equal
   `rawItems` / `simpleItems` / `persons`. This is the case the module-scope `inFlightParses` map
   (§2) exists to cover, and it is not exercised by tests 1–2 above.
4. **Upstream body change** — ETag changes, triggering a memo cache miss and a fresh parse (deduped
   per test 3 if concurrent). The new dataset is stored under the new ETag. If capacity is exceeded,
   the oldest ETag entry is evicted.
5. **Missing ETag fallback** — if `envelope?.ETag` is undefined, the store safely falls back to the
   existing per-request parse without touching either module-scope map, without crashing, emitting a
   single warning.
6. **Unit / Component tests** — verify store initialization, memo retrieval, and LRU eviction
   behavior under simulated repeated and distinct ETags.
7. **Frozen-data regression test — required**: after a memo hit, assert that `rawItems.value`,
   `simpleItems.value`, and `persons.value` (and a sampled nested object, e.g. a
   `simpleTEIMetadata.teiHeader`) are `Object.isFrozen() === true`, and that a representative
   existing consumer pattern (e.g. `simpleItems.find(...)` then read fields) still works unmodified.
   This guards against a future change accidentally reintroducing mutation now that it would throw
   instead of silently succeeding.

To measure during development: wrap the parse with `console.time` / `console.timeEnd` at the parse
site, and the memo hit with the same at the start of the memo-hit branch. After confirming the win,
remove the timing.

## Risk and rollback

- **Risk**: low. A cache layered on top of an existing parse. A bug in the memo logic can only make
  a request slower (re-parse) or no faster (miss). It cannot corrupt downstream data, because the
  memo stores the same `rawItems` / `simpleItems` / `persons` values the existing code produces.
- **New risk introduced by shared references (mitigated by §1a)**: unlike today, cached data is
  shared by reference across concurrent, unrelated SSR requests once the memo is warm. If some
  future change mutates this data in place, it would silently corrupt state for other in-flight
  requests sharing the same ETag — a materially worse failure mode than today's per-request
  isolation. The deep-freeze in §1a converts this into a loud `TypeError` at the point of the
  offending mutation, so the failure mode is a crash/console error pointing at the exact bad line,
  not silent cross-request data corruption. Confirmed by audit that no current code path would trip
  this.
- **Rollback**: revert the single file. Both module-scope maps (the LRU result cache and the
  in-flight-parse dedup map), the `markRaw`/ `deepFreeze` helper, the `ReadonlyDeep<CacheEntry>`
  typing (§1b), the LRU helper, and the store-local `inFlight` guard have no other coupling. No
  `package.json` change is needed for rollback since `type-fest` remains a dependency used elsewhere
  regardless.
- **Edge case to watch**: if `envelope?.ETag` is ever `undefined` on a real response, the memo is
  bypassed and the per-call rebuild runs. This is the safe default. If a `console.log` on a live SSR
  render shows the field missing, either the upstream is misconfigured (fix there) or `projectData`
  is being read before `suspense()` resolves (separate bug). Add a defensive `console.warn` if the
  field is missing on a successful response, to surface this.

## Why not just key on `simpleItems.value` reference alone?

The array reference is per-request in SSR (the Pinia store is recreated per request in Nuxt), and
the parsed dataset is fresh per request. The body-level ETag is the only identity that survives
across SSR requests in the same Node process.

## Related deferred work

`getGroupedSimpleItems` memoization — see `docs/use-tei-headers-store-grouped-items-memo.md`. The
current call site is wrapped in Vue `computed`, so it is not on the critical path; the memo would be
a defensive backstop for future call sites. Defer until this change ships and we have measurements.
