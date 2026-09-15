# Searchbar

The searchbar is a reusable, auto-completing query input that lives in
[app/components/searchbar/](../app/components/searchbar/). It powers both the GeoJSON map/table
filtering (Lucene-like query syntax) and the corpus query window (CQL syntax), switching between a
chip-based "tag" UI and a free-text editor.

## Files at a glance

| File                                                                               | Role                                                                                                                                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [searchbar.vue](../app/components/searchbar/searchbar.vue)                         | Public wrapper component (`<Searchbar>`). Owns mode toggle, special-character buttons, the Search/Clear buttons and query warnings. |
| [tag-searchbar.vue](../app/components/searchbar/tag-searchbar.vue)                 | "Tag" mode. Renders each clause as an editable chip with operator dropdowns and parenthesis groups.                                 |
| [multi-value-searchbar.vue](../app/components/searchbar/multi-value-searchbar.vue) | "Text" mode. A CodeMirror editor with syntax highlighting and inline autocomplete.                                                  |
| [index.ts](../app/components/searchbar/index.ts)                                   | Shared types (`TriggerMap`, `TagItem`, …) and pure helper functions (caret math, query tokenizing, chip rendering).                 |
| [query-language.ts](../app/components/searchbar/query-language.ts)                 | CodeMirror `StreamLanguage` + highlighting + hover tooltips for the **Lucene** query syntax.                                        |
| [query-language-cql.ts](../app/components/searchbar/query-language-cql.ts)         | CodeMirror `StreamLanguage` + highlighting for **CQL** (`[attr="value" & …]`).                                                      |

Related, but outside the folder:

- [use-wibarab-triggers.ts](../app/composables/use-wibarab-triggers.ts) — builds the Wibarab
  `TriggerMap` from the GeoJSON table columns, taxonomy and meta-info.
- [use-cql-triggers.ts](../app/composables/use-cql-triggers.ts) — builds the CQL `TriggerMap` from a
  keyword config.
- [use-filter-parser.ts](../app/composables/use-filter-parser.ts) — parses/normalizes query strings
  and applies them as TanStack-table filters (used when `onSubmit` is not provided).

## Core concept: the `TriggerMap`

Every suggestion the searchbar shows comes from a single `TriggerMap` (defined in
[index.ts](../app/components/searchbar/index.ts)):

```ts
type TriggerMap = Map<
	string, // the "trigger" string the user just typed
	Array<{ value: string; displayValue: string }> // suggestions to offer
>;
```

The map key is the **trigger** — the substring immediately before the caret that should open a
dropdown. The `""` (empty) key holds the first-step suggestions (feature/keyword names) shown at the
start of a clause. Subsequent keys are the per-feature value lists, e.g. `"ft_q:"` (Lucene) or
`"[word="` (CQL). The helpers `getTrigger`, `getTriggerOffset` and `getSearchValue` find the active
trigger and the partial text being matched against it.

Triggers can be **static** (a fixed value list) or **dynamic**. Dynamic triggers (passed via
`dynamic-keys`) skip local filtering and instead emit the typed text through `update:searchTerm`, so
the parent can fetch remote suggestions (the corpus window uses this for the `word` attribute).

## `<Searchbar>` (public API)

`searchbar.vue` is the only component consumers mount. Props:

| Prop                | Type                      | Notes                                                                                                     |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `triggers`          | `TriggerMap`              | **Required.** Suggestion source (see above).                                                              |
| `table`             | `Table<unknown>`          | TanStack table to filter when no `onSubmit` is given.                                                     |
| `onSubmit`          | `(value: string) => void` | If set, search submits the raw query string here instead of filtering a table.                            |
| `queryMode`         | `"lucene" \| "cql"`       | Selects the syntax/highlighting. Defaults to Lucene.                                                      |
| `featureTrigger`    | `string`                  | Trigger for the first selection step. `""` = Lucene, `"["` = CQL.                                         |
| `freeTriggerKey`    | `string`                  | CQL only: attribute key used to wrap free-text input, e.g. `word` → `[word="…"]`.                         |
| `dynamicKeys`       | `ReadonlyArray<string>`   | Bare keys whose value lists are resolved remotely. Internally mapped to `key:` (Lucene) or `[key=` (CQL). |
| `operators`         | `ReadonlyArray<string>`   | Operator choices for the chip dropdowns. Defaults to `AND / OR / AND NOT / OR NOT`.                       |
| `specialCharacters` | `SpecialCharacters`       | Optional buttons that insert glyphs at the caret.                                                         |

Models:

- `v-model` — the current query string.
- `v-model:search-term` — the active partial text for a dynamic trigger (for remote lookups).

Exposed (via `ref`): `submitSearch()` and `value`.

### Behaviour

- **Mode toggle.** A button switches between `tag` and `text` mode. `toggleMode()` preserves the
  current query by routing it through the `v-model` while the components swap (the `syncing` flag
  prevents a feedback loop between the two watchers).
- **Validation.** In table mode it runs `validateQuery()` and renders non-blocking warnings (e.g.
  "consider using parentheses"). When `onSubmit` is set, warnings are suppressed.
- **No-results hint.** When a table is attached and the filtered row model is empty, it shows "Your
  query returned no results."
- **Clear / special characters** delegate to whichever subcomponent is active.

## Tag mode — `tag-searchbar.vue`

Represents the query as an array of `TagItem`s and renders them as chips:

```ts
interface TagItem {
	id: string;
	rawValue: string; // e.g. 'ft_q:"Cairene"' or '[word="bayt"]'
	operator?: string; // connects this tag to the previous one
	children?: Array<TagItem>; // a parenthesized group
}
```

- The `value` computed getter serializes tags back to a query string with `buildRawValue`; the
  setter re-parses an incoming string with `splitQueryIntoTokens` (Lucene) or `splitCqlQuery` (CQL).
- `flatRender` turns the nested tags into a flat list of `RenderToken`s
  (`operator | open-paren | chip | close-paren`) the template iterates over.
- **Chips are editable.** Clicking a chip (`handleTagClick`) re-opens the value dropdown anchored to
  that chip via `parseTagClause`, which splits a clause into `{ prefix, featureKey, rawValue }`.
- **Operators** between chips are `Select` dropdowns; changing one calls `updateOperator` and
  re-submits.
- **Keyboard / paste.** Enter commits the typed text as a new chip (`handleEnter`); Backspace on an
  empty input pops the last chip; pasting a multi-clause string splits it into several chips.
- **CQL free text.** When `freeTriggerKey` is set, plain words are wrapped as `[word="…"]` and
  merged into a preceding free-text tag with `|` (`tryMergeFreeWord`), so typing several words
  builds `[word="a|b|c"]`.
- `getDisplayValue` / `getCqlDisplayValue` map raw clauses to friendly chip labels using the trigger
  map's `displayValue`s.

## Text mode — `multi-value-searchbar.vue`

A CodeMirror editor (`vue-codemirror6`) wrapped in a reka-ui `Combobox`:

- `cmExtensions` picks the language support, highlighting and hover tooltips for the active
  `queryMode`.
- `handleChange` recomputes the active trigger/search value on every input and pointer event and
  opens the dropdown. In CQL mode the dropdown only opens at natural token boundaries (start, after
  whitespace or `]`).
- `handleSelect` inserts the chosen suggestion. For CQL keywords it inserts `[keyword=""]` and
  places the caret between the quotes; otherwise it splices the value in with `replaceValue` and
  repositions the caret.
- A floating `ComboboxAnchor` is positioned at the caret using `getAnchorRect` /
  `getCaretCoordinates` (the mirror-div technique adapted from textarea-caret-position).
- Enter submits when nothing is highlighted and the query is valid.

## Submitting

Both subcomponents share the same `submitSearch()`:

```ts
if (props.onSubmit) {
	props.onSubmit(value);
	return;
} // delegated mode (e.g. corpus search)
parseSearchString(value, table); // apply column filters
table.setGlobalFilter(normalizeParens(normalizeOperators(value))); // set the global filter
```

So a searchbar either drives a TanStack table (default) or hands the raw string back through
`onSubmit`.

## Query languages

Both languages are CodeMirror `StreamLanguage`s that tag tokens (feature/keyword, value, operator,
paren) for highlighting via the `.cm-*` classes in
[searchbar.vue](../app/components/searchbar/searchbar.vue):

- **Lucene** ([query-language.ts](../app/components/searchbar/query-language.ts)): `feature:"value"`
  clauses, `AND/OR/NOT` operators, parentheses, quoted strings, slash patterns (`/g/`) and quantors
  (`ALL/ANY`). It also provides `wordHover`, a tooltip that shows a feature's human-readable name on
  hover.
- **CQL** ([query-language-cql.ts](../app/components/searchbar/query-language-cql.ts)):
  `[attr="value" & attr2="…"]` tokens with `&`/`|` operators, `=`/`!=`, quoted and `/regex/` values.

## Usage examples

GeoJSON map toolbar — filters a table with the Lucene syntax
([geojson-map-toolbar.vue](../app/components/geojson-map-toolbar.vue)):

```vue
<Searchbar v-if="table" ref="searchbar" :table="table" :triggers="wibarabTriggers" />
```

Corpus query window — CQL mode with a remote `word` lookup, submitting via `onSubmit`
([corpus-query-window-content.vue](../app/components/corpus-query-window-content.vue)):

```vue
<Searchbar
	v-model="queryString"
	v-model:search-term="wordSearch"
	:dynamic-keys="['word']"
	feature-trigger="["
	free-trigger-key="word"
	query-mode="cql"
	:on-submit="
		(v) => {
			if (!isSearching) {
				queryString = v;
				searchCorpus();
			}
		}
	"
	:special-characters="specialCharacters"
	:triggers="cqlTriggers"
/>
```
