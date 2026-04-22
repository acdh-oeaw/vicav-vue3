# Dictionary Query Entry Template Mapping

`app/components/dict-query-window-content.vue` renders dictionary API entries after converting
`RestVLEEntry` objects into the view model exported from `app/utils/dict-entry-rendering.ts`.

## Top-Level Entry Fields

| API field              | Rendered model | Template location                  |
| ---------------------- | -------------- | ---------------------------------- |
| `id`                   | `id`           | Identifiers row, fallback loop key |
| `sid`                  | `sid`          | Identifiers row                    |
| `lemma`                | `lemma`        | Fallback for card title            |
| `status`               | `status`       | Header badge                       |
| `type`                 | `type`         | Header badge                       |
| `entry` as HTML string | `html`         | Rendered directly with `v-html`    |
| `_links.self.href`     | `selfHref`     | Identifiers row link               |
| `storedEntryMd5`       | `metadata`     | Metadata row                       |
| `took`                 | `metadata`     | Metadata row                       |

## Nested Entry Payload

| API field                                               | Rendered model               | Template location                    |
| ------------------------------------------------------- | ---------------------------- | ------------------------------------ |
| `entry.entry.@id`                                       | `xmlId`                      | Identifiers row                      |
| `entry.entry.@lang`                                     | `entryLang`, `metadata`      | Metadata row                         |
| `lemma_form.orth`, `lemma_form.orths[]`                 | `lemmaForms[].orthographies` | Forms row and title preference       |
| `lemma_form.variant_form`, `lemma_form.variant_forms[]` | `variantForms[]`             | Forms row                            |
| `lemmaVariant_form`, `lemmaVariant_forms[]`             | `variantForms[]`             | Forms row                            |
| `multiWordUnit_form`                                    | `lemmaForms[]`               | Forms row                            |
| `gramGrp` and nested `gramGrp.gramGrp`                  | `grammar`                    | Grammar row                          |
| `geographic_usg`                                        | `locations`, `location`      | Locations row and header description |
| `translation_cit`, `translation_cits[]`                 | `translations`               | Translations row                     |
| `note`, `notes[]`                                       | `notes`                      | Notes row                            |

## Forms And Grammar

| API field                                                                      | Rendered model     | Template location                |
| ------------------------------------------------------------------------------ | ------------------ | -------------------------------- |
| `inflected_form`, `inflected_forms[]`                                          | `inflectedForms[]` | Inflected Forms row              |
| form `orth`, `orths[]`                                                         | `orthographies`    | Form text with language badges   |
| form `@type`, `@subtype`, `@lang`, `@ana`                                      | `metadata`         | Compact badges inside form cards |
| form `geographic_usg`                                                          | `locations`        | Form location badges             |
| form `gramGrp`                                                                 | `grammar`          | Form grammar list                |
| grammar `pos_gram`                                                             | `grammar[]`        | Grammar rows                     |
| grammar `root_gram`, `root_grams`, `roots_gram`                                | `grammar[]`        | Grammar rows                     |
| grammar `diaRoot_gram`, `synRoot_gram`                                         | `grammar[]`        | Grammar rows                     |
| grammar `degree_gram`, `inflectionType_gram`, `msd_gram`                       | `grammar[]`        | Grammar rows                     |
| grammar `number_gram`, `gender_gram`, `person_gram`                            | `grammar[]`        | Grammar rows                     |
| grammar `constraint_gram`, `collocate_gram`, `valency_gram`, `government_gram` | `grammar[]`        | Grammar rows                     |

## Senses And Examples

| API field                                                         | Rendered model                               | Template location    |
| ----------------------------------------------------------------- | -------------------------------------------- | -------------------- |
| `sense`, `senses[]`                                               | `senses[]`                                   | Senses row           |
| sense `@id`                                                       | `senses[].id`                                | Sense card header    |
| sense `@ana`                                                      | `senses[].ana`, `metadata`                   | Sense card badges    |
| sense `def`, `defs[]`                                             | `senses[].definitions`                       | Definitions block    |
| sense `translationEquivalent_cit`, `translationEquivalent_cits[]` | `senses[].translations`                      | Sense translations   |
| sense `gramGrp`, `gramGrps[]`                                     | `senses[].grammar`                           | Sense grammar block  |
| sense `domain_*`, `pragmatics_*`, `socioCultural_usg`             | `senses[].metadata`                          | Sense card badges    |
| `example_cit`, `example_cits[]`                                   | `senses[].examples[]` with `kind: "direct"`  | Examples block       |
| `related_xr`, `related_xrs[]`                                     | `senses[].examples[]` with `kind: "related"` | Examples block       |
| example `quote`                                                   | `examples[].quote`                           | Example card quote   |
| example `translation_cit`, `translation_cits[]`                   | `examples[].translations`                    | Example translations |
| example `@type`, `@subtype`, `@vutlsk`                            | `examples[].metadata`                        | Example card badges  |
| example `listBibl`                                                | `examples[].bibliography`                    | Bibliography badges  |
| example `feature`, `features[]`                                   | `examples[].editors`                         | Example editor line  |

## Debug-Only Fields

The full original `RestVLEEntry` is preserved as `raw` and remains available through the existing
debug JSON output. Any API field not mapped above is still inspectable there.

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
