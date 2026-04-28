# Dictionary Entry Component Mapping

`app/components/dict-query-window-content.vue` owns query state and passes raw `RestVLEEntry`
objects to `app/components/dict-entry.vue`.

`DictEntry` is the rendering boundary for one dictionary API entry. It normalizes the raw entry with
`normalizeEntry` from `app/utils/dict-entry-rendering.ts`, then renders either server-provided HTML
or the structured entry card.

## Component Boundary

| Responsibility                     | Location                                                       |
| ---------------------------------- | -------------------------------------------------------------- |
| API query state and pagination     | `app/components/dict-query-window-content.vue`                 |
| Loop over `data._embedded.entries` | `app/components/dict-query-window-content.vue`                 |
| Raw-entry normalization            | `app/components/dict-entry.vue` via `normalizeEntry(entry)`    |
| Structured card rendering          | `app/components/dict-entry.vue`                                |
| Server-rendered HTML fallback      | `app/components/dict-entry.vue` via `v-html`                   |
| Debug raw JSON output              | `app/components/dict-entry.vue` when `debug` is true           |
| XML/JSON entry links               | `app/components/dict-entry.vue`, using `dictId` and entry `id` |

`DictEntry` props:

| Prop       | Type                       | Behavior                                              |
| ---------- | -------------------------- | ----------------------------------------------------- |
| `entry`    | `RestVLEEntry`             | Required raw API entry.                               |
| `dictId`   | `string \| number`         | Used to build XML/JSON entry links.                   |
| `debug`    | `boolean`, default `false` | Shows raw normalized-entry source JSON.               |
| `expanded` | `boolean`, default `false` | Initial local state for examples, notes, and editors. |

## Entry Shell

| API field              | Rendered model                  | Template location                                            |
| ---------------------- | ------------------------------- | ------------------------------------------------------------ |
| `entry` as HTML string | `html`                          | Rendered directly with `v-html`; structured card is skipped. |
| full `RestVLEEntry`    | `raw`                           | Debug-only JSON block when `debug` is true.                  |
| `id`                   | `id`                            | XML/JSON link query parameter and header `id` badge.         |
| `status`               | `status`                        | Header badge only when present and not `released`.           |
| `type`                 | `type`                          | Header icon and tooltip for `entry` and `example`.           |
| `_links.self.href`     | `selfHref`                      | View-model-only; no template output.                         |
| `sid`                  | `sid`                           | View-model-only; no template output.                         |
| `lemma`                | `lemma`, contributes to `title` | Used only as title fallback after lemma form text.           |
| `storedEntryMd5`       | `metadata[]` item `stored md5`  | Header metadata badge.                                       |
| `took`                 | `metadata[]` item `took`        | Header metadata badge.                                       |

The header also contains the per-entry expand/collapse icon button. Collapsing affects only
examples, notes, and editors.

## Entry Payload

| API field                                                                                                       | Rendered model                                       | Template location                                                                                          |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `entry.entry.@id`                                                                                               | `xmlId`                                              | View-model-only; no template output.                                                                       |
| `entry.entry.@lang`                                                                                             | `entryLang`, `metadata[]` item `entry language`      | Header language metadata badge with language icon and color coding; `entryLang` itself is view-model-only. |
| `lemma_form.orth`, `lemma_form.orths[]`                                                                         | `lemmaForms[].orthographies`, contributes to `title` | Lemma row; first non-missing lemma orthography is the card title preference.                               |
| `multiWordUnit_form`                                                                                            | `lemmaForms[]`                                       | Lemma row.                                                                                                 |
| `lemma_form.variant_form`, `lemma_form.variant_forms[]`                                                         | `variantForms[]`                                     | Lemma row, under a `Variant` label.                                                                        |
| `lemmaVariant_form`, `lemmaVariant_forms[]`                                                                     | `variantForms[]`                                     | Lemma row, under a `Variant` label.                                                                        |
| `gramGrp` and nested `gramGrp.gramGrp`                                                                          | `grammar[]`                                          | Header colored grammar badges.                                                                             |
| `geographic_usg.place_name.$` on payload or top-level example                                                   | `location`                                           | Header location description under the title.                                                               |
| `lemma_form.geographic_usg`, `lemma_form.geographic_usgs[]`, payload `geographic_usg`, example `geographic_usg` | `locations[]`                                        | Dedicated Locations row with pin-icon badges.                                                              |
| `translation_cit`, `translation_cits[]` on payload and top-level example                                        | `translations[]`                                     | Translations row with language-icon badges when a language is present.                                     |
| top-level example `quote`                                                                                       | `quote`                                              | Quote row and title fallback.                                                                              |
| payload/top-level example `feature`, `features[]`                                                               | `editors[]`                                          | Editors row when expanded; collapsed hint otherwise.                                                       |
| `note`, `notes[]`                                                                                               | `notes[]`                                            | Notes row when expanded; collapsed hint otherwise.                                                         |
| payload `def`, `defs[]`                                                                                         | none                                                 | Not rendered except through debug `raw`.                                                                   |
| payload `example_cit`, `example_cits[]`, `related_xr`, `related_xrs[]`                                          | none                                                 | Not rendered at entry level except through debug `raw`; sense-level examples still render.                 |

## Forms

| API field                                  | Rendered model                         | Template location                                                                                       |
| ------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| form `orth`, `orths[]`                     | `orthographies[]`                      | Forms row text, variant text, or inflected form card text with language-icon badges.                    |
| form `@type`                               | `type`, `metadata[]` item `type`       | Form metadata badge, except `type: lemma`, `type: variant`, and `type: inflected` are hidden.           |
| form `@subtype`                            | `subtype`, `metadata[]` item `subtype` | Form metadata badge.                                                                                    |
| form `@lang`                               | `metadata[]` item `lang`               | Form language metadata badge with language icon and color coding.                                       |
| form `@ana`                                | `metadata[]` item `ana`                | Form metadata badge.                                                                                    |
| form `socioCultural_usg.$`, `reg_usg.$`    | `metadata[]` item `usage`              | Form metadata badge.                                                                                    |
| form `workflow_note.$`                     | `metadata[]` item `workflow`           | Form metadata badge.                                                                                    |
| form `gramGrp`                             | `grammar[]`                            | Rendered for variant forms and inflected form cards; lemma-form grammar is normalized but not rendered. |
| form `geographic_usg`, `geographic_usgs[]` | `locations[]`                          | Rendered in the top-right of inflected form cards with pin-icon badges.                                 |
| `inflected_form`, `inflected_forms[]`      | `inflectedForms[]`                     | Inflected Forms row as nested cards.                                                                    |

## Grammar Items

| API field                                                  | Rendered label                         | Template location                                                                            |
| ---------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pos_gram`                                                 | `Part of speech`                       | Entry header badges, variant grammar lists, inflected grammar lists, or sense grammar lists. |
| `derivedVerbClass_gram`                                    | `Class`                                | Same grammar rendering locations.                                                            |
| `synRoot_gram`, `diaRoot_gram`                             | `Syn root`, `Dia root`                 | Same grammar rendering locations.                                                            |
| `root_gram`, `root_grams[]`, `roots_gram`                  | `Root`, `Root N`, `Roots`              | Same grammar rendering locations.                                                            |
| `aspect_gram`, `number_gram`, `person_gram`, `gender_gram` | `Aspect`, `Number`, `Person`, `Gender` | Same grammar rendering locations.                                                            |
| `mood_gram`, `voice_gram`, `degree_gram`                   | `Mood`, `Voice`, `Degree`              | Same grammar rendering locations.                                                            |
| `inflectionType_gram`, `msd_gram`                          | `Inflection`, `MSD`                    | Same grammar rendering locations.                                                            |
| `constraint_gram`, `morphPattern_gram`, `collocate_gram`   | `Constraint`, `Pattern`, `Collocate`   | Same grammar rendering locations.                                                            |
| `valency_gram`, `government_gram`, `subc_gram`             | `Valency`, `Government`, `Subclass`    | Same grammar rendering locations.                                                            |
| `socioCultural_usg`, `temporal_usg`                        | `Socio-cultural`, `Temporal`           | Same grammar rendering locations.                                                            |

## Senses And Examples

| API field                                                         | Rendered model                                      | Template location                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `sense`, `senses[]`                                               | `senses[]`                                          | Senses row cards.                                                                                                           |
| sense `@id`                                                       | `senses[].id`                                       | Key-only; no visible sense caption.                                                                                         |
| sense `@ana`                                                      | `senses[].ana`, `metadata[]` item `ana`             | Sense card badges.                                                                                                          |
| sense `domain_usg`, `domain_usgs[]`                               | `metadata[]` items `domain`, `domain N`             | Sense card badges.                                                                                                          |
| sense `pragmatics_usg`, `pragmatics_usgs[]`                       | `metadata[]` items `pragmatics`, `pragmatics N`     | Sense card badges.                                                                                                          |
| sense `socioCultural_usg`                                         | `metadata[]` item `socio-cultural`                  | Sense card badge.                                                                                                           |
| sense `def`, `defs[]`                                             | `definitions[]`                                     | Sense Definitions block with language-icon badges.                                                                          |
| sense `translationEquivalent_cit`, `translationEquivalent_cits[]` | `translations[]`                                    | Sense translation lines with language-icon badges; `form.orth` is the main text and `gloss` renders in brackets next to it. |
| sense `gramGrp`, `gramGrps[]`                                     | `grammar[]`                                         | Sense grammar block.                                                                                                        |
| sense `example_cit`, `example_cits[]`                             | `examples[]` with `kind: "direct"`                  | Example cards when expanded; count hint otherwise.                                                                          |
| sense `related_xr`, `related_xrs[]`                               | `examples[]` with `kind: "related"`                 | Related example cards when expanded; count hint otherwise.                                                                  |
| example `quote`                                                   | `examples[].quote`                                  | Example quote line with language-icon badge.                                                                                |
| example `geographic_usg`                                          | `examples[].locations[]`                            | Top-right of example cards with pin-icon badges.                                                                            |
| example `translation_cit`, `translation_cits[]`                   | `examples[].translations[]`                         | Example translation lines with language-icon badges.                                                                        |
| example `@type`, `@subtype`, `@vutlsk`                            | `examples[].metadata[]`                             | Normalized but not rendered in example cards.                                                                               |
| related `@type`, text `$`                                         | `examples[].metadata[]` items `relation`, `warning` | Normalized but not rendered in example cards.                                                                               |
| example `listBibl[].title.@ref`, `biblScope.@unit`, `biblScope.$` | `examples[].bibliography[]`                         | Bibliography badges inside example cards.                                                                                   |
| example `feature`, `features[]`                                   | `examples[].editors[]`                              | Example editor lines inside example cards.                                                                                  |

## Collapsed Details

`DictEntry` keeps local expansion state initialized from the `expanded` prop.

| Rendered model     | Collapsed output                              | Expanded output  |
| ------------------ | --------------------------------------------- | ---------------- |
| `sense.examples[]` | Button like `3 Examples available` per sense. | Example cards.   |
| `notes[]`          | Button like `2 Notes available`.              | Note paragraphs. |
| `editors[]`        | Button like `4 Editors available`.            | Editor rows.     |

Clicking any count hint expands the whole entry. The top-right chevron button toggles the whole
entry between collapsed and expanded.

## Render Status Changes

| Field or model             | Current status                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Raw-to-rendered mapping    | Moved from the window component into `DictEntry`.                                        |
| Entry grammar `grammar[]`  | Rendered as colored header badges.                                                       |
| Entry metadata             | Rendered as header badges, not a table row.                                              |
| Entry `locations[]`        | Rendered in a dedicated Locations row with pin-icon badges.                              |
| Inflected-form locations   | Rendered at the top right of each inflected form card with pin-icon badges.              |
| Example locations          | Rendered at the top right of each example card with pin-icon badges.                     |
| Example kind and metadata  | Normalized but no longer rendered as badges.                                             |
| Language badges            | Rendered with a language icon and deterministic language-based color coding.             |
| Section headings           | Rendered as visually distinct left-column labels via `sectionHeadingClass`.              |
| `type`                     | Rendered as entry/example icon tooltip only.                                             |
| `id`                       | Rendered as a header badge and used for XML/JSON link query parameters.                  |
| `sid`, `xmlId`, `selfHref` | No longer rendered; retained in the view model or debug `raw`.                           |
| `sense.id`                 | No longer rendered as a visible sense caption; retained as card key data.                |
| form `type: lemma`         | No longer rendered as a metadata badge in the Lemma row.                                 |
| form `type: variant`       | No longer rendered as a metadata badge in variant form blocks.                           |
| form `type: inflected`     | No longer rendered as a metadata badge in inflected form cards.                          |
| `raw`                      | Debug-only output; contains all API fields, including fields not normalized or rendered. |

## Maintenance Prompt

Use this prompt after changing `app/components/dict-entry.vue`,
`app/components/dict-query-window-content.vue`, or `app/utils/dict-entry-rendering.ts`:

```text
Review app/components/dict-entry.vue, app/components/dict-query-window-content.vue, and
app/utils/dict-entry-rendering.ts.

Update docs/dict-entry-component-mapping.md so it accurately documents the current mapping from
RestVLEEntry and nested dictionary API fields to the rendered view model and DictEntry template.

Include:
- newly rendered fields and where they appear in the template
- fields that moved between rows, cards, badges, collapsed hints, or debug-only output
- renamed rendered model properties
- fields that are normalized but no longer rendered

Keep the document concise and table-driven. Do not change application code.
```
