# OpenAPI Spec Change Requests (upstream: `acdh-oeaw/vicav-app-api`)

The frontend (`vicav-vue3`) derives Zod validators from `openapi.json` and checks the data the
backends serve against them. This document lists the places where the spec in
`acdh-oeaw/vicav-app-api` (re-downloaded into the frontend on every `generate:api-client`) does not
describe the data the dev backends actually serve.

- **Method:** `GET /vicav/project` was fetched from all four dev backends and validated with Zod
  v4.5.4 (`z.fromJSONSchema`) against upstream `master`
  (`https://raw.githubusercontent.com/acdh-oeaw/vicav-app-api/master/openapi.json`, 157 schemas,
  upstream commit `2f90bf7214`) on **2026-10-30**. Body ETags: vicav
  `3F2243AF113D7C333E84C03F3C95EA5F`, shawi `76AF078F6BBD571130A482B201EC2E64`, tunocent
  `B8BADF6AE7ECFEBE9D6BE6538894405D`, wibarab `B9175828CE4F714C5BDBCA6D05E01CC5`.
- **Frontend policy:** report-only — mismatches are surfaced, never papered over. The app validates
  the parts it knows about (`TeiCorpusSchema`, `GeoPlaceSchema`, `GeoFeatureSchema` in
  `app/lib/project/prepare-project.ts`) and reports them as diagnostics (console + toast); the
  full-envelope check is the offline harness at the end of this document. The change requests below
  are the way to make those reports clean again.
- **Tooling note:** Zod v4 `fromJSONSchema` maps `oneOf` to an **exclusive** union (exactly one
  branch must match) and `anyOf` to a non-exclusive union (at least one). It enforces
  `additionalProperties: false` and `patternProperties`, but it **ignores** `minProperties` /
  `maxProperties` (verified with zod 4.5.4) — the proposals below therefore avoid them.

## Status (2026-10-30)

Envelope validation with the current spec: **vicav VALID, shawi VALID, tunocent VALID, wibarab
VALID** (0 issues; 22 table entries, 4734 TEIs, 4027 geo features).

The envelope check is clean, but that is partly an artefact of the two catch-alls upstream added
with CR-3 and CR-5 (`{ "type": "object" }` / `{ "type": "array" }`): the shapes listed below are
**not described by the spec at all** and pass only because of them. They are invisible to the
envelope check and to the frontend.

| CR    | Topic                                                     | Spec location                         | Live data                            |
| ----- | --------------------------------------------------------- | ------------------------------------- | ------------------------------------ |
| CR-7  | the feature-type vocabulary array is not described        | `staticData.table.items`              | wibarab `table[1]` (24 entries)      |
| CR-8  | the variety collection's `column_headings` do not match   | `ColumnHeadings`, `GazetteerMarker`   | wibarab `geo[0]` (96 headings)       |
| CR-9  | the `ft_*` variety table is not described                 | `staticData.table.items`              | wibarab `table[0]` (111 `ft_*` keys) |
| CR-10 | single-TEI table entries `{ "TEI": … }` are not described | `staticData.table.items`, `TeiCorpus` | vicav/shawi/wibarab (5 entries)      |
| CR-11 | the TEI headers of those single documents do not validate | `TeiHeader`                           | vicav/shawi/wibarab (5 entries)      |

All five are **open**. The proposed schema fragments are in
[`docs/openapi-patches/`](./openapi-patches/) (one file per CR).

### What the proposals change

The proposals were applied to the upstream spec in memory and checked against the live envelopes:

| variant                           | vicav   | shawi    | tunocent | wibarab  |
| --------------------------------- | ------- | -------- | -------- | -------- |
| upstream `master` (157 schemas)   | VALID   | VALID    | VALID    | VALID    |
| + CR-7/8/9/10, catch-alls kept    | VALID   | VALID    | VALID    | VALID    |
| + CR-7/8/9/10, catch-alls dropped | 1 issue | 2 issues | VALID    | 2 issues |

The last row is the point of the exercise: as long as the catch-alls stay, the union accepts
everything and the named branches only _document_ the shapes. Once every shape that occurs has a
schema of its own, the catch-alls can go — and the only remaining mismatches are the five TEI
headers of CR-11.

---

## CR-7: the feature-type vocabulary array in `staticData.table` is not described

**Status:** open — accepted by the CR-3 catch-all, not described by the spec.

**Location:** `components.schemas.projectConfig_type.properties.staticData.properties.table.items`

**Live evidence (wibarab `staticData.table[1]`, 24 entries):**

```json
[
	{ "personal_pronouns": "Personal pronouns" },
	{ "personal_pronouns.bound_pronouns": "Bound personal pronouns" },
	{ "personal_pronouns.independent_pronouns": "Independent personal pronouns" },
	…
]
```

One object per feature-type path, mapping the path to its label. The paths mirror the `category`
values of the collection's `column_headings` (CR-8).

**Why it is not reported:** the entry is an array and matches no named branch of the table union
(`Biblio`, `Geo`, `TeiCorpus`, `GuidedTourSteps`); it is accepted by the `{ "type": "array" }`
catch-all that upstream added with CR-3 ("Switch staticData.table schema to be a suggestion only").
Before that it was rejected (`invalid_union`, "expected object, received array").

**Proposed** (add to the table union):

```json
"FeatureTypeVocabularyEntry": {
  "title": "One feature type path with its label",
  "type": "object",
  "additionalProperties": { "type": "string" }
},
"FeatureTypeVocabulary": {
  "title": "The feature type taxonomy of the feature database",
  "type": "array",
  "items": { "$ref": "#/components/schemas/FeatureTypeVocabularyEntry" }
}
```

```json
"items": {
  "anyOf": [
    { "$ref": "#/components/schemas/Biblio" },
    { "$ref": "#/components/schemas/Geo" },
    { "$ref": "#/components/schemas/TeiCorpus" },
    { "$ref": "#/components/schemas/GuidedTourSteps" },
    { "$ref": "#/components/schemas/FeatureTypeVocabulary" },
    { "$ref": "#/components/schemas/FeatureTypeTable" },
    { "$ref": "#/components/schemas/TeiDocumentWrapper" },
    { "type": "object" },
    { "type": "array" }
  ]
}
```

The two catch-alls can stay — they are the upstream's deliberate "suggestion only" mode — but the
named branches should describe the shapes that actually occur, so that the catch-all is a fallback
and not the only thing that accepts them.

**Frontend impact:** the shape is **used** — `app/composables/use-feature-taxonomy.ts:105` and
`app/components/geojson-table-window-content.vue:46` read `staticData.table[1]` as the feature-type
→ label vocabulary that builds the feature taxonomy tree. It is **not validated**
(`app/lib/project/prepare-project.ts:244` keeps only entries with a `TEIs` key).

---

## CR-8: the variety collection's `column_headings` do not match the `ColumnHeadings` schema

**Status:** open — accepted by the CR-5 catch-all, not described by the spec.

**Locations:**

- `components.schemas.ColumnHeadings.properties.column_headings.items` (reached via
  `FeatureCollection.properties` → `ColumnHeadings`)
- `components.schemas.GazetteerMarker` (the `description` const)

**Live evidence (wibarab `staticData.geo[0].properties.column_headings`, 96 items):**

| count | shape                       | example                                                                            |
| ----- | --------------------------- | ---------------------------------------------------------------------------------- |
| 1     | `{ name }`                  | `{ "name": "Name" }`                                                               |
| 1     | `{ country }`               | `{ "country": "Country" }`                                                         |
| 1     | `{ alternateNames }`        | `{ "alternateNames": "Alternate Names" }`                                          |
| 93    | `{ category, count, ft_* }` | `{ "category": "consonant_phenomena", "count": 452, "ft_q": "Reflexes of OA *q" }` |

**Spec (unchanged upstream):**

```json
"column_headings": {
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "Reference": { "type": "string" },
      "Heading": { "type": "string" }
    }
  }
}
```

**Problem:** none of the 96 live items matches the item schema — the plain columns carry a single
unknown key, the feature-type columns carry `category` + `count` + `ft_*`. With
`additionalProperties: false` the `ColumnHeadings` branch rejects all of them.

The same collection also fails the `GazetteerMarker` branch: the schema pins the description to the
VICAV string (`"const": "GEOJSON of the VICAV gazetteer"`), while the variety collection ships
`"description": "GEOJSON for the WIBARAB Feature DB"`. The three other backends and wibarab's
`geo[1]` do match the const.

**Why it is not reported:** `FeatureCollection.properties` is an `anyOf` with a
`{ "type": "object" }` catch-all (upstream "Open feature collection properties to be any JSON
object"), so the whole properties object passes unvalidated.

**Proposed** — describe the shape instead of accepting everything:

```json
"ColumnHeading": {
  "title": "One column of the feature collection",
  "oneOf": [
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "name": { "type": "string" },
        "country": { "type": "string" },
        "alternateNames": { "type": "string" }
      }
    },
    {
      "type": "object",
      "additionalProperties": false,
      "required": ["category", "count"],
      "properties": {
        "category": { "type": "string" },
        "count": { "type": "number" }
      },
      "patternProperties": { "^ft_": { "type": "string" } }
    }
  ]
}
```

with `ColumnHeadings.properties.column_headings.items` →
`{ "$ref": "#/components/schemas/ColumnHeading" }`, and `GazetteerMarker` relaxed from a pinned
string to a free-form label:

```json
"GazetteerMarker": {
  "type": "object",
  "properties": { "description": { "type": "string" } }
}
```

The two branches of `ColumnHeading` are mutually exclusive (the plain branch has no `category` /
`count`, the feature-type branch requires them), so the union stays exclusive.

**Frontend impact:** the shape is **used** — `app/composables/use-feature-taxonomy.ts:114` and
`app/components/geojson-table-window-content.vue:40` read `column_headings` to build the columns of
the variety table. It is **not validated**: the frontend's own `GeoFeatureSchema` keeps
`properties: z.any()` (`app/types/global.ts:178`) and the collection metadata is never checked
against the spec.

---

## CR-9: the `ft_*` variety table in `staticData.table` is not described

**Status:** open — matches `TeiCorpus` only because `TeiCorpus` describes nothing.

**Location:** `components.schemas.projectConfig_type.properties.staticData.properties.table.items`

**Live evidence (wibarab `staticData.table[0]`, 111 `ft_*` keys):**

```json
{
	"ft_q": {
		"taxonomy": [
			{ "ft_q.soundChanges": "Sound Changes" },
			{ "ft_q.soundChanges.affrication": "Affrication" },
			{ "ft_q.exceptionalCases": "Exceptional Cases" }
		],
		"values": {
			"/ġ/ exceptions": "ft_q.exceptionalCases",
			"/ḳ/": "ft_q.soundChanges",
			"/g/ and /ǧ/": "ft_q.soundChanges.affrication"
		}
	}
}
```

- 111 `ft_*` keys, each `{ taxonomy, values }`; `taxonomy` is an array of
  `{ "<taxonomy path>": "<label>" }` nodes and is **empty for 89 of the 111 keys**.
- `values` maps a feature value (e.g. `/ḳ/`) to the taxonomy path of the sub-feature it belongs to
  (e.g. `ft_q.soundChanges`) — 1877 values, all strings. The labels of those paths are in
  `taxonomy`.
- The `ft_*` keys are the same namespace as the `ft_*` columns of the collection (CR-8) and the
  `ft_*` properties of the geo features (CR-6): the 93 keys of those two are a subset of the 111
  keys here — the table additionally holds the feature types that have values but no places.

**Why it is not reported:** the entry is an object, so the `{ "type": "object" }` catch-all accepts
it. It also matches the `TeiCorpus` branch — but only because `TeiCorpus` has no `required` and no
`additionalProperties: false`, i.e. it matches **every** object (see CR-10).

**Proposed** (add to the table union):

```json
"FeatureTypeTaxonomyEntry": {
  "title": "One node of the feature type taxonomy",
  "type": "object",
  "additionalProperties": { "type": "string" }
},
"FeatureTypeTableEntry": {
  "title": "One feature type with its taxonomy path and its values",
  "type": "object",
  "additionalProperties": false,
  "required": ["values"],
  "properties": {
    "taxonomy": {
      "type": "array",
      "items": { "$ref": "#/components/schemas/FeatureTypeTaxonomyEntry" }
    },
    "values": { "type": "object", "additionalProperties": { "type": "string" } }
  },
  "patternProperties": { "^ft_": { "$ref": "#/components/schemas/FeatureTypeTableEntry" } }
},
"FeatureTypeTable": {
  "title": "The feature type table of the feature database",
  "type": "object",
  "additionalProperties": false,
  "patternProperties": { "^ft_": { "$ref": "#/components/schemas/FeatureTypeTableEntry" } }
}
```

`FeatureTypeTable` must be closed (`additionalProperties: false`): with `patternProperties` alone it
would match **every** object, because nothing forces an `ft_*` key to be present.

**Frontend impact:** the shape is **used** — `app/components/geojson-table-window-content.vue:233`
passes `staticData.table[0]` to `buildFeatureTaxonomy`, which resolves the feature values and their
taxonomy. It is **not validated** (`app/lib/project/prepare-project.ts:244` keeps only entries with
a `TEIs` key).

---

## CR-10: single-TEI table entries `{ "TEI": … }` are not described

**Status:** open — matches `TeiCorpus` only because `TeiCorpus` describes nothing.

**Locations:**

- `components.schemas.projectConfig_type.properties.staticData.properties.table.items`
- `components.schemas.TeiCorpus`

**Live evidence — 5 entries across three backends:**

| backend | table entry | `@id` of the wrapped TEI | content                          |
| ------- | ----------- | ------------------------ | -------------------------------- |
| vicav   | `table[5]`  | `vicav_biblio`           | bibliography TEI                 |
| shawi   | `table[2]`  | `vicav_geo`              | geo TEI (919 `listPlace` places) |
| shawi   | `table[4]`  | `vicav_biblio`           | bibliography TEI                 |
| wibarab | `table[4]`  | `vicav_biblio`           | bibliography TEI                 |
| wibarab | `table[5]`  | `vicav_geo`              | geo TEI (919 `listPlace` places) |

```json
{
	"TEI": {
		"@id": "vicav_biblio",
		"teiHeader": { … },
		"text": { … }
	}
}
```

**Why it is not reported:** the wrapper matches the `TeiCorpus` branch — but only because
`TeiCorpus` has **no `required`** (so an object without `TEIs` is a corpus) and **no
`additionalProperties: false`** (so the `TEI` key is allowed). The wrapped TEI is therefore never
validated against the `TEI` schema — the whole document is invisible to the envelope check. This is
also why the shapes of CR-9 and the single-TEI entries cannot be detected: the `TeiCorpus` branch
matches every object.

**Proposed** — a schema for the wrapper, and a `TeiCorpus` that actually describes a corpus:

```json
"TeiDocument": {
  "title": "A single TEI document",
  "type": "object",
  "required": ["@id", "teiHeader"],
  "properties": {
    "@id": { "type": "string" },
    "@space": { "type": "string" },
    "teiHeader": { "$ref": "#/components/schemas/TeiHeader" },
    "text": { "type": "object" }
  }
},
"TeiDocumentWrapper": {
  "title": "A single TEI document, wrapped",
  "type": "object",
  "additionalProperties": false,
  "required": ["TEI"],
  "properties": { "TEI": { "$ref": "#/components/schemas/TeiDocument" } }
}
```

```json
"TeiCorpus": {
  "type": "object",
  "additionalProperties": false,
  "required": ["@id", "TEIs"],
  "properties": {
    "@id": { "type": "string" },
    "@document-uri": { "type": "string" },
    "teiHeader": { "$ref": "#/components/schemas/TeiHeader" },
    "TEIs": { "type": "array", "items": { "$ref": "#/components/schemas/TEI" } },
    "standOff": { … }
  }
}
```

Verified against the live data: all 22 corpus entries of the four backends still validate against
the tightened `TeiCorpus`, and the five wrapper entries now match `TeiDocumentWrapper` and no longer
`TeiCorpus` — which is what makes the TEI headers of those documents visible (CR-11).

**Frontend impact:** the wrapped `vicav_geo` document is **used** —
`app/lib/project/prepare-project.ts:266` looks for the geo places in `item`, `item.Geo` and
`item.TEI`; its 919 `listPlace` entries are validated with `GeoPlaceSchema`. The **TEI header** of
these documents is **not validated** by the frontend (`parseRawItems` keeps only entries with a
`TEIs` key, `app/lib/project/prepare-project.ts:244`).

---

## CR-11: the TEI headers of the single-TEI documents do not validate

**Status:** open — a data/spec mismatch that is invisible because of CR-10.

**Location:** `components.schemas.TEI` → `TeiHeader` (reached via `TeiCorpus.TEIs`)

**Live evidence:** validating the five single-TEI documents of CR-10 against `TeiHeader` yields
issues that the corpus TEIs do not have:

| document            | path                                  | issue                                   |
| ------------------- | ------------------------------------- | --------------------------------------- |
| `vicav_biblio` (3×) | `fileDesc.publicationStmt.publishers` | expected array, received undefined      |
| `vicav_geo` (2×)    | `fileDesc.publicationStmt.publishers` | expected array, received undefined      |
| `vicav_geo` (2×)    | `fileDesc.titleStmt`                  | unrecognized keys: `author`, `respStmt` |
| `vicav_geo` (2×)    | `fileDesc.publicationStmt.p`          | expected object, received string        |
| `vicav_geo` (2×)    | `fileDesc.sourceDesc.p`               | expected object, received string        |
| `vicav_geo` (2×)    | `encodingDesc`                        | unrecognized key: `geoDecls`            |

The corpus TEIs (4734 across the four backends) have none of these issues — the `vicav_biblio` and
`vicav_geo` documents come from a different pipeline.

Live shapes that the spec does not accept:

```json
"titleStmt": {
	"title": { "$": "VICAV Geolocations" },
	"author": { "names": [{ "$": "Charly Mörth" }, { "$": "Stephan Prochazka" }] },
	"respStmt": { "resp": { "$": "Datamodel provided by" }, "name": { "$": "Daniel Schopper" } }
},
"publicationStmt": { "p": "" },
"sourceDesc": { "p": "" },
"encodingDesc": {
	"geoDecls": [
		{ "@id": "dms", "@datum": "WGS84-DMS", "$": "World Geodetic System: degrees - minutes - seconds" }
	]
}
```

**Proposed** — either fix the data or widen the spec:

| mismatch                             | data fix                                                | spec fix                                          |
| ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------- |
| `publicationStmt.publishers` missing | add the publisher array to `vicav_biblio` / `vicav_geo` | drop `publishers` from `PublicationStmt.required` |
| `titleStmt.author` (object)          | rename to `authors` and use an array                    | add `author` to `TitleStmt`                       |
| `titleStmt.respStmt` (object)        | rename to `respStmts` and use an array                  | add `respStmt` to `TitleStmt`                     |
| `p` is a string                      | emit `{ "$": "…" }`                                     | allow a string in `P`                             |
| `encodingDesc.geoDecls`              | —                                                       | add `geoDecls` to `EncodingDesc`                  |

The data fix is preferable: the corpus TEIs already use the spec's shape, so the two pipelines
should agree.

**Frontend impact:** none today — the frontend never validates these headers (`parseRawItems` skips
every entry without a `TEIs` key, `app/lib/project/prepare-project.ts:244`). Once CR-10 makes the
wrapper visible, the frontend would have to be extended to validate it; the geo places inside
`vicav_geo` are valid and stay unaffected (their `listPlace` entries use the singular
`prefLabel_placeName` shape).

---

## Closed change requests

These are implemented upstream (or no longer reproduce) and are only listed for traceability — the
details have been removed.

| CR   | Topic                                                    | Resolution                                                                                               |
| ---- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| CR-1 | `item_type.params` flat `oneOf`                          | implemented — `item_type` is a `oneOf` discriminated on `targetType` (18 branches)                       |
| CR-2 | `GeoPlace` singular vs. plural `prefLabel`               | moot — the plural shape is gone from all backends; the spec side is unchanged (singular only)            |
| CR-3 | `staticData.table.items` bare `{"type": "object"}`       | implemented — `oneOf` → `anyOf` with catch-alls and a warning `description` (the "suggestion only" mode) |
| CR-4 | `TEI` schema staleness                                   | implemented — the missing keys were added; 0 invalid TEIs in the live data                               |
| CR-5 | `FeatureCollection.properties` bare `{"type": "object"}` | implemented — `oneOf` → `anyOf` with a catch-all and a warning `description`                             |
| CR-6 | `Feature.properties` — wibarab variety features          | implemented — exclusive 4-way `oneOf` + `VarietyFeatureProperties` (upstream commit `2f90bf7214`)        |

Two latent gaps from CR-4 remain unfixed upstream but have no live occurrence any more:
`TitleStmt.respStmts` is array-only (a single `respStmt` object is still rejected) and the
`Person.@sex` / `Responsibility` enums are unchanged.

---

## Reproducing the validation

Node ≥ 18 (uses the repo's `zod@4` and `app/assets/openapi.json`, which is re-downloaded from
upstream `master` by `pnpm run generate:api-client`), run from the `vicav-vue3` repo root:

```bash
node --input-type=module -e '
import { createRequire } from "node:module";
import path from "node:path";
const req = createRequire(import.meta.url);
const z = req("zod");
const openapi = req(path.resolve(process.cwd(), "app/assets/openapi.json"));
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
// remap #/components/schemas/ -> #/$defs/, which is the only transformation Zod v4 needs here
const walk = (s) => {
  if (Array.isArray(s)) return s.map(walk);
  if (!isObject(s)) return s;
  if (typeof s.$ref === "string" && s.$ref.startsWith("#/components/schemas/"))
    return { ...s, $ref: "#/$defs/" + s.$ref.slice(21) };
  const m = {};
  for (const [k, v] of Object.entries(s)) m[k] = walk(v);
  return m;
};
const defs = {};
for (const [k, v] of Object.entries(openapi.components.schemas)) defs[k] = walk(v);
const Schema = z.fromJSONSchema({ $ref: "#/$defs/ProjectConfig", $defs: defs });
for (const url of process.argv.slice(1)) {
  const body = await (await fetch(url, { headers: { accept: "application/json" } })).json();
  const r = await Schema.safeParseAsync(body);
  if (r.success) {
    console.log(url, "VALID");
    continue;
  }
  console.log(url, `INVALID (${r.error.issues.length} issues)`);
  for (const i of r.error.issues.slice(0, 10))
    console.log("  -", i.path.join("."), "::", i.message);
}
' \
  https://vicav-dev.acdh.oeaw.ac.at/vicav/project \
  https://shawi-api.acdh-dev.oeaw.ac.at/vicav/project \
  https://tunocent-api.acdh-dev.oeaw.ac.at/vicav/project \
  https://wibarab-api.acdh-dev.oeaw.ac.at/vicav/project
```

To see the shapes that the catch-alls hide (CR-7, CR-8, CR-9, CR-10), apply the proposals in
`docs/openapi-patches/` to the spec and check the individual schemas against the live payloads:

```bash
node --input-type=module -e '
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
const req = createRequire(import.meta.url);
const z = req("zod");
const spec = req(path.resolve(process.cwd(), "app/assets/openapi.json"));
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const walk = (s) => {
  if (Array.isArray(s)) return s.map(walk);
  if (!isObject(s)) return s;
  if (typeof s.$ref === "string" && s.$ref.startsWith("#/components/schemas/"))
    return { ...s, $ref: "#/$defs/" + s.$ref.slice(21) };
  const m = {};
  for (const [k, v] of Object.entries(s)) m[k] = walk(v);
  return m;
};
// apply the proposals of docs/openapi-patches/ to the spec
const getPath = (obj, parts) => parts.reduce((node, part) => node[part], obj);
const setPath = (obj, parts, value) => {
  const parent = parts.slice(0, -1).reduce((node, part) => node[part], obj);
  parent[parts.at(-1)] = value;
};
for (const file of fs.readdirSync("docs/openapi-patches")) {
  const patch = JSON.parse(fs.readFileSync(path.resolve("docs/openapi-patches", file), "utf8"));
  for (const [name, schema] of Object.entries(patch.addSchemas ?? {}))
    spec.components.schemas[name] = schema;
  for (const op of patch.operations ?? []) {
    const parts = op.path.replace(/^\//, "").split("/");
    if (op.op === "add" && parts.at(-1) === "-") getPath(spec, parts.slice(0, -1)).push(op.value);
    else if (op.op === "replace") setPath(spec, parts, op.value);
  }
}
const defs = {};
for (const [k, v] of Object.entries(spec.components.schemas)) defs[k] = walk(v);
const schema = (name) => z.fromJSONSchema({ $ref: "#/$defs/" + name, $defs: defs });
const body = await (await fetch("https://wibarab-api.acdh-dev.oeaw.ac.at/vicav/project", {
  headers: { accept: "application/json" },
})).json();
const table = body.projectConfig.staticData.table;
const geo = body.projectConfig.staticData.geo;
console.log("table[1] vocabulary    ->", schema("FeatureTypeVocabulary").safeParse(table[1]).success);
console.log("table[0] ft table      ->", schema("FeatureTypeTable").safeParse(table[0]).success);
console.log("geo[0] column headings ->", schema("ColumnHeadings").safeParse(geo[0].properties).success);
// the wrapped TEI documents fail here — that is CR-11
const wrapped = schema("TeiDocumentWrapper").safeParse(table[4]);
console.log("table[4] TEI wrapper   ->", wrapped.success);
if (!wrapped.success)
  for (const issue of wrapped.error.issues) console.log("   -", issue.path.join("."), "::", issue.message);
'
```

The proposals in `docs/openapi-patches/` were checked against the live payloads with exactly this
method: they accept every live occurrence and reject malformed variants (a vocabulary entry with a
non-string value, an `ft_*` entry without `values`, a column heading with an unknown key).
