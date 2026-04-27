# Dictionary Query Entry Template Mapping

`app/components/dict-query-window-content.vue` renders dictionary API entries after converting
`RestVLEEntry` objects into the view model exported from `app/utils/dict-entry-rendering.ts`.

## Entry Shell

| API field              | Rendered model                  | Template location                                                                 |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `entry` as HTML string | `html`                          | Rendered directly with `v-html`; structured card is skipped.                      |
| full `RestVLEEntry`    | `raw`                           | Debug-only JSON block when the debug toggle is enabled.                           |
| `id`                   | `id`                            | Card loop key fallback, XML/JSON link query parameter, header `id` badge.         |
| `status`               | `status`                        | Header badge only when present and not `released`.                                |
| `type`                 | `type`                          | Header icon and tooltip for `entry` and `example`; not rendered for other values. |
| `_links.self.href`     | `selfHref`                      | View-model-only; no template output.                                              |
| `sid`                  | `sid`                           | View-model-only; no template output.                                              |
| `lemma`                | `lemma`, contributes to `title` | Used only as title fallback after lemma form text.                                |
| `storedEntryMd5`       | `metadata[]` item `stored md5`  | Metadata row badge.                                                               |
| `took`                 | `metadata[]` item `took`        | Metadata row badge.                                                               |

## Entry Payload

| API field                                                                                                       | Rendered model                                       | Template location                                                                          |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `entry.entry.@id`                                                                                               | `xmlId`                                              | View-model-only; no template output.                                                       |
| `entry.entry.@lang`                                                                                             | `entryLang`, `metadata[]` item `entry language`      | Metadata row badge; `entryLang` itself is view-model-only.                                 |
| `lemma_form.orth`, `lemma_form.orths[]`                                                                         | `lemmaForms[].orthographies`, contributes to `title` | Forms row; first non-missing lemma orthography is the card title preference.               |
| `multiWordUnit_form`                                                                                            | `lemmaForms[]`                                       | Forms row.                                                                                 |
| `lemma_form.variant_form`, `lemma_form.variant_forms[]`                                                         | `variantForms[]`                                     | Forms row, under a `Variant` label.                                                        |
| `lemmaVariant_form`, `lemmaVariant_forms[]`                                                                     | `variantForms[]`                                     | Forms row, under a `Variant` label.                                                        |
| `gramGrp` and nested `gramGrp.gramGrp`                                                                          | `grammar[]`                                          | Header colored grammar pills; moved from the former Grammar table row.                     |
| `geographic_usg.place_name.$` on payload or top-level example                                                   | `location`                                           | Header location description.                                                               |
| `lemma_form.geographic_usg`, `lemma_form.geographic_usgs[]`, payload `geographic_usg`, example `geographic_usg` | `locations[]`                                        | Locations row badges.                                                                      |
| `translation_cit`, `translation_cits[]` on payload and top-level example                                        | `translations[]`                                     | Translations row.                                                                          |
| top-level example `quote`                                                                                       | `quote`                                              | Quote row and title fallback.                                                              |
| payload/top-level example `feature`, `features[]`                                                               | `editors[]`                                          | Editors row.                                                                               |
| `note`, `notes[]`                                                                                               | `notes[]`                                            | Notes row.                                                                                 |
| payload `def`, `defs[]`                                                                                         | none                                                 | Not rendered except through debug `raw`.                                                   |
| payload `example_cit`, `example_cits[]`, `related_xr`, `related_xrs[]`                                          | none                                                 | Not rendered at entry level except through debug `raw`; sense-level examples still render. |

## Forms

| API field                                  | Rendered model                         | Template location                                                                                           |
| ------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| form `orth`, `orths[]`                     | `orthographies[]`                      | Forms row text, variant text, or inflected form card text with language badges.                             |
| form `@type`                               | `type`, `metadata[]` item `type`       | Metadata badge in forms and inflected cards, except `type: lemma` is intentionally hidden in the Forms row. |
| form `@subtype`                            | `subtype`, `metadata[]` item `subtype` | Form metadata badge.                                                                                        |
| form `@lang`                               | `metadata[]` item `lang`               | Form metadata badge.                                                                                        |
| form `@ana`                                | `metadata[]` item `ana`                | Form metadata badge.                                                                                        |
| form `socioCultural_usg.$`, `reg_usg.$`    | `metadata[]` item `usage`              | Form metadata badge.                                                                                        |
| form `workflow_note.$`                     | `metadata[]` item `workflow`           | Form metadata badge.                                                                                        |
| form `gramGrp`                             | `grammar[]`                            | Rendered for variant forms and inflected form cards; lemma-form grammar is normalized but not rendered.     |
| form `geographic_usg`, `geographic_usgs[]` | `locations[]`                          | Rendered only in inflected form cards; lemma/variant form locations are normalized but not rendered.        |
| `inflected_form`, `inflected_forms[]`      | `inflectedForms[]`                     | Inflected Forms row as nested cards.                                                                        |

## Grammar Items

| API field                                                  | Rendered label                         | Template location                                                                           |
| ---------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pos_gram`                                                 | `Part of speech`                       | Entry header pills, variant grammar lists, inflected grammar lists, or sense grammar lists. |
| `derivedVerbClass_gram`                                    | `Class`                                | Same grammar rendering locations.                                                           |
| `synRoot_gram`, `diaRoot_gram`                             | `Syn root`, `Dia root`                 | Same grammar rendering locations.                                                           |
| `root_gram`, `root_grams[]`, `roots_gram`                  | `Root`, `Root N`, `Roots`              | Same grammar rendering locations.                                                           |
| `aspect_gram`, `number_gram`, `person_gram`, `gender_gram` | `Aspect`, `Number`, `Person`, `Gender` | Same grammar rendering locations.                                                           |
| `mood_gram`, `voice_gram`, `degree_gram`                   | `Mood`, `Voice`, `Degree`              | Same grammar rendering locations.                                                           |
| `inflectionType_gram`, `msd_gram`                          | `Inflection`, `MSD`                    | Same grammar rendering locations.                                                           |
| `constraint_gram`, `morphPattern_gram`, `collocate_gram`   | `Constraint`, `Pattern`, `Collocate`   | Same grammar rendering locations.                                                           |
| `valency_gram`, `government_gram`, `subc_gram`             | `Valency`, `Government`, `Subclass`    | Same grammar rendering locations.                                                           |
| `socioCultural_usg`, `temporal_usg`                        | `Socio-cultural`, `Temporal`           | Same grammar rendering locations.                                                           |

## Senses And Examples

| API field                                                         | Rendered model                                      | Template location                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `sense`, `senses[]`                                               | `senses[]`                                          | Senses row cards.                                                  |
| sense `@id`                                                       | `senses[].id`                                       | Key-only; no visible sense caption.                                |
| sense `@ana`                                                      | `senses[].ana`, `metadata[]` item `ana`             | Sense card badges.                                                 |
| sense `domain_usg`, `domain_usgs[]`                               | `metadata[]` items `domain`, `domain N`             | Sense card badges.                                                 |
| sense `pragmatics_usg`, `pragmatics_usgs[]`                       | `metadata[]` items `pragmatics`, `pragmatics N`     | Sense card badges.                                                 |
| sense `socioCultural_usg`                                         | `metadata[]` item `socio-cultural`                  | Sense card badge.                                                  |
| sense `def`, `defs[]`                                             | `definitions[]`                                     | Sense Definitions block with language badges.                      |
| sense `translationEquivalent_cit`, `translationEquivalent_cits[]` | `translations[]`                                    | Sense translation lines with language badges.                      |
| sense `gramGrp`, `gramGrps[]`                                     | `grammar[]`                                         | Sense grammar block.                                               |
| sense `example_cit`, `example_cits[]`                             | `examples[]` with `kind: "direct"`                  | Example cards inside the sense.                                    |
| sense `related_xr`, `related_xrs[]`                               | `examples[]` with `kind: "related"`                 | Related example cards; relation/warning appear as metadata badges. |
| example `quote`                                                   | `examples[].quote`                                  | Example quote line with language badge.                            |
| example `geographic_usg`                                          | `examples[].locations[]`                            | Example location badges.                                           |
| example `translation_cit`, `translation_cits[]`                   | `examples[].translations[]`                         | Example translation lines with language badges.                    |
| example `@type`, `@subtype`, `@vutlsk`                            | `examples[].metadata[]`                             | Example card badges.                                               |
| related `@type`, text `$`                                         | `examples[].metadata[]` items `relation`, `warning` | Related example card badges.                                       |
| example `listBibl[].title.@ref`, `biblScope.@unit`, `biblScope.$` | `examples[].bibliography[]`                         | Bibliography badges inside example cards.                          |
| example `feature`, `features[]`                                   | `examples[].editors[]`                              | Example editor lines.                                              |

## Render Status Changes

| Field or model             | Current status                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Entry grammar `grammar[]`  | Moved from a separate Grammar row to colored header pills.                               |
| Section headings           | Rendered as visually distinct left-column labels via shared `sectionHeadingClass`.       |
| `type`                     | Moved from a generic header badge to entry/example icon tooltip only.                    |
| `id`                       | Moved from the old identifiers row to a header badge and link query parameter.           |
| `sid`, `xmlId`, `selfHref` | No longer rendered; retained in the view model or debug `raw`.                           |
| `sense.id`                 | No longer rendered as a visible sense caption; retained as card key data.                |
| form `type: lemma`         | No longer rendered as a metadata badge in the Forms row.                                 |
| `raw`                      | Debug-only output; contains all API fields, including fields not normalized or rendered. |

## Maintenance Prompt

Use this prompt after changing `app/components/dict-query-window-content.vue` or
`app/utils/dict-entry-rendering.ts`:

```text
Review app/components/dict-query-window-content.vue and app/utils/dict-entry-rendering.ts.
Update docs/dict-query-entry-template-mapping.md so it accurately documents the current mapping
from RestVLEEntry and nested dictionary API fields to the rendered view model and template.

Include:
- newly rendered fields and where they appear in the template
- fields that moved between rows, cards, badges, or debug-only output
- renamed rendered model properties
- fields that are no longer rendered

Keep the document concise and table-driven. Do not change application code.
```
