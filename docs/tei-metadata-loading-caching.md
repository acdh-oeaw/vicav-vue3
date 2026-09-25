# Project preparation and TEI metadata caching

`useProjectInfo()` fetches `/vicav/project` through the existing API client before calling
`app/lib/project/prepare-project.ts`. The server still uses `fetchWithETag` (upstream HTTP ETag and
Cache-Control handling, including its existing transport fallback); the browser uses native fetch.
Preparation adds no TTL or freshness fallback.

Preparation validates corpus entries in `projectConfig.staticData.table`, recursively including
TEIs, and builds the same compact `simpleItems` and corpus-level `persons` used by the TEI store.
Entries without `TEIs` are silently ignored for corpus selection. Geographic envelopes are selected
by probing `item`, `item.Geo`, and `item.TEI` for `text.body.listPlace`. Invalid corpora and their
texts, invalid places, and invalid derived metadata are dropped. Corpus errors retain their existing
console logging. GeoJSON features are validated with the loose feature schema; invalid features
retain the existing null placeholder behavior. The GeoJSON store copies the prepared collection into
request-local mutable state rather than validating it again.

The application-owned `ProjectResponse` type adds `projectConfig._validationErrors`, initialized to
an empty array whenever project config exists. Each diagnostic has a deterministic ID, source,
record ID when available, index, and plain issues containing code, path, and message. Diagnostics
contain neither invalid records nor error instances. The backend schema and generated client stay
unchanged, and the body ETag still identifies the original upstream data.

The `/status` route also runs `prepareProject()` for successful backend responses and exposes the
resulting diagnostics as a top-level `validationErrors` array in its JSON response. If the backend
request fails, the route returns the same field as an empty array alongside the error details.

## Shared preparation cache

Each server process owns a four-entry LRU keyed by the effective backend URL (trailing slash
removed) and body-level ETag. Concurrent cold requests share an in-flight preparation promise.
Successful entries contain the enriched response and derived metadata and are deeply frozen before
publication. Failed preparations publish nothing and can be retried. Requests without an ETag, and
requests using configured API credentials, bypass shared preparation. The browser owns its own cache
through the same module. A weak association lets the store consume metadata from an already prepared
query response, including for authenticated or unversioned queries, without a second preparation. No
request stores, reactive proxies, or toast queues enter the cache.

## SSR and hydration

Vue Query and Pinia are created independently for each SSR request. The project query retains its
existing 15-minute stale time, refetch behavior, and disabled structural sharing. The
`project-query-client` plugin dehydrates query data, including diagnostics, and normalizes volatile
timestamps into three-minute buckets before serializing it.

The TEI initialization plugin awaits the project query on the server. The TEI store consumes
prepared metadata and records a pipeline-version-2 snapshot with public project identity and body
ETag. On the client, a compatible hydrated snapshot reuses and freezes its compact metadata without
reading the raw table. Incompatible or missing snapshots use preparation as a fallback. Store-local
in-flight initialization deduplicates calls and clears after success or failure.

`project-validation.client.ts` depends on `project-query-client` and begins observing diagnostics
only after `app:mounted`. It displays one negative toast per validation source, summarizing affected
records and skipped data. Browser-session reporting tracks diagnostic IDs together with project
ETags. Re-observation, dismissal, and navigation do not replay identical diagnostics. A different
ETag removes outstanding old notifications and can notify again; diagnostics stay in query data.

## Metadata consumers

The store exposes `simpleItems`, `persons`, `initialization`, `initialize()`, and
`getGroupedSimpleItems()`. It stores no raw corpora or header copies. Existing accessor and grouping
exports remain available from the store module. Geographic, person, responsibility, category,
duration, and publication joins retain their previous behavior. Grouping and sorting remain
request-local operations over immutable prepared metadata.

Validation covers project static data only. Dictionary searches, other API responses, and user input
are outside this pipeline. Cache sharing is process-local; body ETags must identify upstream
static-data changes. Unversioned diagnostics use a browser-session sentinel for notification
deduplication.
