# Dictionary Entry Component Mapping

`app/components/dict-query-window-content.vue` owns dictionary query state and passes raw
`RestVLEEntry` objects to `app/components/dict-entry.vue`.

`DictEntry` is the rendering boundary for one dictionary API entry. It normalizes the raw entry with
`normalizeEntry` from `app/utils/dict-entry-rendering.ts`, then renders either server-provided HTML
or the compact structured entry template.

## Component Boundary

| Responsibility                     | Location                                                       |
| ---------------------------------- | -------------------------------------------------------------- |
| API query state and pagination     | `app/components/dict-query-window-content.vue`                 |
| Loop over `data._embedded.entries` | `app/components/dict-query-window-content.vue`                 |
| Raw-entry normalization            | `app/components/dict-entry.vue` via `normalizeEntry(entry)`    |
| Structured compact rendering       | `app/components/dict-entry.vue`                                |
| Server-rendered HTML fallback      | `app/components/dict-entry.vue` via `v-html`                   |
| Debug raw JSON output              | `app/components/dict-entry.vue` when `debug` is true           |
| XML/JSON entry links               | `app/components/dict-entry.vue`, using `dictId` and entry `id` |

`DictEntry` props:

| Prop       | Type                       | Behavior                                                 |
| ---------- | -------------------------- | -------------------------------------------------------- |
| `entry`    | `RestVLEEntry`             | Required raw API entry.                                  |
| `dictId`   | `string \| number`         | Used to build XML/JSON entry links.                      |
| `debug`    | `boolean`, default `false` | Shows raw normalized-entry source JSON.                  |
| `expanded` | `boolean`, default `false` | Accepted for compatibility; no longer affects rendering. |

## Entry Shell

| API field              | Rendered model                  | Template location                                             |
| ---------------------- | ------------------------------- | ------------------------------------------------------------- |
| `entry` as HTML string | `html`                          | Rendered directly with `v-html`; compact template is skipped. |
| full `RestVLEEntry`    | `raw`                           | Debug-only JSON block when `debug` is true.                   |
| `id`                   | `id`                            | XML/JSON link query parameter.                                |
| `type`                 | `type`                          | Header icon: entry or example.                                |
| `_links.self.href`     | `selfHref`                      | View-model-only; no template output.                          |
| `sid`                  | `sid`                           | View-model-only; no template output.                          |
| `lemma`                | `lemma`, contributes to `title` | Used only as title fallback after lemma form text.            |
| `status`               | `status`                        | Normalized but not rendered in compact template.              |
| `storedEntryMd5`       | `metadata[]` item `stored md5`  | Normalized but not rendered in compact template.              |
| `took`                 | `metadata[]` item `took`        | Normalized but not rendered in compact template.              |

The header has no expand/collapse control. XML and JSON icon links are rendered in the header action
area when both `dictId` and entry `id` are available.

## Entry Payload

| API field                                                                                                       | Rendered model                                       | Template location                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `entry.entry.@id`                                                                                               | `xmlId`                                              | View-model-only; no template output.                                                                                               |
| `entry.entry.@lang`                                                                                             | `entryLang`, `metadata[]` item `entry language`      | Normalized but not rendered; individual text nodes expose language as native browser tooltips.                                     |
| `lemma_form.orth`, `lemma_form.orths[]`                                                                         | `lemmaForms[].orthographies`, contributes to `title` | Header lemma text; `lang` appears as a tooltip when available.                                                                     |
| `lemma_form.@source`                                                                                            | `lemmaForms[].source`                                | Header source bibliography badge when source resolves through entry `listBibl`.                                                    |
| `lemma_form.variant_form`, `lemma_form.variant_forms[]`                                                         | `variantForms[]`                                     | Header variant text, locations, and optional bibliography badge.                                                                   |
| `lemmaVariant_form`, `lemmaVariant_forms[]`                                                                     | `variantForms[]`                                     | Header variant text, locations, and optional bibliography badge.                                                                   |
| `multiWordUnit_form`                                                                                            | `lemmaForms[]`                                       | Header form text if present.                                                                                                       |
| `gramGrp` and nested `gramGrp.gramGrp`                                                                          | `grammar[]`                                          | Header grammar summary: part of speech, class, synRoot, diaRoot; placeholder `-` values are hidden.                                |
| `lemma_form.geographic_usg`, `lemma_form.geographic_usgs[]`, payload `geographic_usg`, example `geographic_usg` | `locations[]`                                        | Entry-level locations are normalized; lemma-form locations render in the header.                                                   |
| `listBibl[]`                                                                                                    | `bibliography[]`                                     | Used to resolve source ids into compact bibliography badges, e.g. `Younes 2021, p.40`.                                             |
| `etym.etymon_cit.form.orth`, `etym.etymon_cit.form.orths[]`, `etym.etymon_cits[]`, nested `etym`                | `etymologies[]`, `etymologyGroups[]`                 | Etymology row; each root etymon group renders on its own line, nested etymons stay inline, and text uses language colors/tooltips. |
| payload/top-level example `feature`, `features[]`                                                               | `editors[]`                                          | Editors row as unique comma-separated editor names only.                                                                           |
| `translation_cit`, `translation_cits[]` on payload and top-level example                                        | `translations[]`                                     | Normalized but not rendered in compact template.                                                                                   |
| top-level example `quote`                                                                                       | `quote`                                              | Normalized and used as title fallback; not rendered as a separate row.                                                             |
| `note`, `notes[]`                                                                                               | `notes[]`                                            | Normalized but not rendered in compact template.                                                                                   |
| payload `def`, `defs[]`                                                                                         | none                                                 | Not rendered except through debug `raw`.                                                                                           |

## Forms

| API field                                  | Rendered model                         | Template location                                                                   |
| ------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------- |
| form `orth`, `orths[]`                     | `orthographies[]`                      | Header forms, inflected forms, and variants; `lang` appears as a tooltip.           |
| form `@source`                             | `source`                               | Source bibliography badge when source resolves through entry `bibliography[]`.      |
| form `@type`                               | `type`, `metadata[]` item `type`       | Normalized but not rendered as a visible badge.                                     |
| form `@subtype`                            | `subtype`, `metadata[]` item `subtype` | Normalized but not rendered in compact template.                                    |
| form `@lang`                               | `metadata[]` item `lang`               | Normalized but not rendered; text-node language is used for tooltips.               |
| form `@ana`                                | `metadata[]` item `ana`                | Normalized but not rendered in compact template.                                    |
| form `socioCultural_usg.$`, `reg_usg.$`    | `metadata[]` item `usage`              | Normalized but not rendered in compact template.                                    |
| form `workflow_note.$`                     | `metadata[]` item `workflow`           | Normalized but not rendered in compact template.                                    |
| form `gramGrp`                             | `grammar[]`                            | Inflected flection text in parentheses immediately after the attached form text.    |
| form `geographic_usg`, `geographic_usgs[]` | `locations[]`                          | Location badges next to the attached header/inflected/variant form.                 |
| nested `variant_form`, `variant_forms[]`   | `variants[]`                           | Inline after the parent inflected form; own flection info and badges stay attached. |
| `inflected_form`, `inflected_forms[]`      | `inflectedForms[]`                     | `INFL. FORMS` row.                                                                  |

## Locations And Bibliography

| API field                                         | Rendered model              | Template location                                                      |
| ------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| `geographic_usg.place_name.$`                     | `locations[].place`         | Location badge text.                                                   |
| `geographic_usg.$`                                | `locations[].place`         | Location badge text when no `place_name` exists.                       |
| `geographic_usg.tribe_name.$`                     | `locations[].tribe`         | Appended to location badge as `Place, Tribe` or tribe-only text.       |
| `geographic_usg.tribe_names[0].$`                 | `locations[].tribe`         | First tribe only; additional tribe names are currently not displayed.  |
| repeated equivalent locations                     | deduped `locations[]`       | Duplicate badges are removed per display group, preserving order.      |
| `listBibl[].@id`                                  | `bibliography[].id`         | Source lookup key after stripping `#` from `@source`.                  |
| `listBibl[].title.@ref`, `listBibl[].biblScope.$` | `bibliography[].label`      | Source badge text; `zot:` is stripped and trailing year is spaced out. |
| example-local `listBibl[]`                        | `examples[].bibliography[]` | Bibliography badges inside example boxes.                              |

## Grammar Items

| API field                                                  | Rendered label                         | Template location                                       |
| ---------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `pos_gram`                                                 | `Part of speech`                       | Header grammar summary.                                 |
| `derivedVerbClass_gram`                                    | `Class`                                | Header grammar summary.                                 |
| `synRoot_gram`, `diaRoot_gram`                             | `Syn root`, `Dia root`                 | Header grammar summary as `value (synRoot/diaRoot)`.    |
| `aspect_gram`, `number_gram`, `person_gram`, `gender_gram` | `Aspect`, `Number`, `Person`, `Gender` | Inflected form flection text.                           |
| `arguments_gram`, `arguments_grams[]`                      | `Argument`, `Argument N`               | Sense grammar line before sense translations.           |
| `root_gram`, `root_grams[]`, `roots_gram`                  | `Root`, `Root N`, `Roots`              | Normalized; rendered only if used by active summaries.  |
| `mood_gram`, `voice_gram`, `degree_gram`                   | `Mood`, `Voice`, `Degree`              | Normalized; rendered where active grammar text is used. |
| `inflectionType_gram`, `msd_gram`                          | `Inflection`, `MSD`                    | Normalized; rendered where active grammar text is used. |
| `constraint_gram`, `morphPattern_gram`, `collocate_gram`   | `Constraint`, `Pattern`, `Collocate`   | Normalized; rendered where active grammar text is used. |
| `valency_gram`, `government_gram`, `subc_gram`             | `Valency`, `Government`, `Subclass`    | Normalized; rendered where active grammar text is used. |
| `socioCultural_usg`, `temporal_usg`                        | `Socio-cultural`, `Temporal`           | Normalized; rendered where active grammar text is used. |

## Senses And Examples

| API field                                                         | Rendered model                                      | Template location                                                                                        |
| ----------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `sense`, `senses[]`                                               | `senses[]`                                          | One compact sense box per sense.                                                                         |
| sense `@id`                                                       | `senses[].id`                                       | Key data and left-column label association.                                                              |
| sense ordinal                                                     | derived from array index                            | Left column as `SENSE` or `SENSE 1`, `SENSE 2`, etc.                                                     |
| sense `@ana`                                                      | `senses[].ana`, `metadata[]` item `ana`             | Normalized but not rendered in compact template.                                                         |
| sense `domain_usg`, `domain_usgs[]`                               | `metadata[]` items `domain`, `domain N`             | Normalized but not rendered in compact template.                                                         |
| sense `pragmatics_usg`, `pragmatics_usgs[]`                       | `metadata[]` items `pragmatics`, `pragmatics N`     | Normalized but not rendered in compact template.                                                         |
| sense `socioCultural_usg`                                         | `metadata[]` item `socio-cultural`                  | Normalized but not rendered in compact template.                                                         |
| sense `def`, `defs[]`                                             | `definitions[]`                                     | Normalized but not rendered in compact template.                                                         |
| sense `translationEquivalent_cit`, `translationEquivalent_cits[]` | `translations[]`                                    | Sense translations grouped by language; entries with the same language render as a comma-separated list. |
| translation equivalent `@source`                                  | `translations[].source`                             | Bibliography badge immediately after the sourced translation.                                            |
| sense `gramGrp`, `gramGrps[]`                                     | `grammar[]`                                         | Bold italic grammar line before translations, e.g. `(ʕala, l-)`.                                         |
| sense `geographic_usg`, `geographic_usgs[]`                       | `locations[]`                                       | Location badges at the bottom of the sense box.                                                          |
| sense `example_cit`, `example_cits[]`                             | `examples[]` with `kind: "direct"`                  | Compact example boxes; always rendered when present.                                                     |
| sense `related_xr`, `related_xrs[]`                               | `examples[]` with `kind: "related"`                 | Compact example boxes; always rendered when present.                                                     |
| example `quote`                                                   | `examples[].quote`                                  | Bold italic first line in example box; `lang` appears as a tooltip.                                      |
| example `@source`                                                 | `examples[].source`                                 | Bibliography badge when source resolves through entry `bibliography[]`.                                  |
| example `geographic_usg`                                          | `examples[].locations[]`                            | Top-right location badges in example box.                                                                |
| example `translation_cit`, `translation_cits[]`                   | `examples[].translations[]`                         | Example translation lines; language colors and language tooltips when `lang` exists.                     |
| example `@type`, `@subtype`, `@vutlsk`                            | `examples[].metadata[]`                             | Normalized but not rendered in compact template.                                                         |
| related `@type`, text `$`                                         | `examples[].metadata[]` items `relation`, `warning` | Normalized but not rendered in compact template.                                                         |
| example `feature`, `features[]`                                   | `examples[].editors[]`                              | Normalized but not rendered in compact template.                                                         |

## Render Status Changes

| Field or behavior         | Current status                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ |
| Expand/collapse state     | Removed from rendering; all senses and examples render inline.                 |
| XML/JSON links            | Rendered as header action buttons.                                             |
| Entry id/status/metadata  | No longer rendered as header badges.                                           |
| Notes                     | Normalized but hidden for now.                                                 |
| Editors                   | Rendered as unique names only; dates, actions, and statuses are hidden.        |
| Left-column labels        | Rendered as paired grid cells aligned with each content row.                   |
| Language badges           | Replaced by native browser `title` tooltips on text items with language data.  |
| Section card/table layout | Replaced by compact orange header, label column, forms row, sense boxes.       |
| Server HTML entries       | Still rendered directly with `v-html`; compact template is skipped.            |
| Debug output              | Still available and contains all API fields, including hidden normalized data. |

## Maintenance Prompt

Use this prompt after changing `app/components/dict-entry.vue`,
`app/components/dict-query-window-content.vue`, `app/utils/dict-entry-rendering.ts`,
`app/assets/openapi.json`, or the generated API client:

```text
Review app/components/dict-entry.vue, app/components/dict-query-window-content.vue, and
app/utils/dict-entry-rendering.ts. If the OpenAPI schema or generated API client changed, also
review app/assets/openapi.json and app/lib/api-client/index.ts.

Update docs/dict-entry-component-mapping.md so it accurately documents the current mapping from
RestVLEEntry and nested dictionary API fields to the rendered view model and DictEntry template.

Include:
- newly rendered fields and where they appear in the template
- API fields newly accepted by the schema/client and how normalization handles them
- fields that moved between rows, cards, badges, collapsed hints, or debug-only output
- renamed rendered model properties
- fields that are normalized but no longer rendered

Keep the document concise and table-driven. Do not change application code.
```
