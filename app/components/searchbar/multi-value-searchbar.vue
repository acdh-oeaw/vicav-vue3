<script setup lang="ts">
import { syntaxHighlighting } from "@codemirror/language";
import { tooltips } from "@codemirror/view";
import type { Table } from "@tanstack/vue-table";
import { computedWithControl } from "@vueuse/core";
import {
	type AcceptableValue,
	ComboboxAnchor,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxPortal,
	ComboboxRoot,
	Label,
	type ReferenceElement,
	useFilter,
} from "reka-ui";
import { computed, nextTick, ref, watch } from "vue";
import CodeMirror from "vue-codemirror6";

import {
	getAnchorRect,
	getList,
	getSearchValue,
	getTrigger,
	getTriggerOffset,
	getValue,
	replaceValue,
	type TriggerMap,
} from "./index.ts";
import { queryHighlightStyle, queryLanguageSupport, wordHover } from "./query-language.ts";
import { cqlHighlightStyle, cqlLanguageSupport } from "./query-language-cql.ts";

const props = defineProps<{
	table?: Table<unknown>;
	triggers: TriggerMap;
	queryMode?: "lucene" | "cql";
	onSubmit?: (value: string) => void;
	dynamicTriggers?: ReadonlyArray<string>;
}>();

const emit = defineEmits<{ "update:searchTerm": [value: string] }>();

const { parseSearchString, validateQuery, normalizeOperators, normalizeParens } = useFilterParser();

const { contains } = useFilter({ sensitivity: "base" });

const cmExtensions = computed(() => {
	if (props.queryMode === "cql") {
		return [
			cqlLanguageSupport,
			syntaxHighlighting(cqlHighlightStyle),
			tooltips({ parent: document.body }),
		];
	}
	return [
		queryLanguageSupport,
		wordHover(props.triggers),
		syntaxHighlighting(queryHighlightStyle),
		tooltips({ parent: document.body }),
	];
});

const value = ref("");
const trigger = ref<string | null>(null);
const caretOffset = ref<number | null>(null);
const open = ref(false);
const searchValue = ref("");

const textareaRef = ref<InstanceType<typeof ComboboxInput>>();

function getCm() {
	return textareaRef.value as unknown as InstanceType<typeof CodeMirror>;
}

function getCursorOffset() {
	return getCm()?.getCursor() ?? 0;
}

const reference = computedWithControl(
	() => [searchValue.value, open.value],
	() =>
		({
			getBoundingClientRect: () => {
				if (textareaRef.value?.$el) {
					const { x, y, height } = getAnchorRect(
						textareaRef.value.$el,
						value.value,
						getCursorOffset(),
						props.triggers,
					);
					return { x, y, height, top: y, left: x, width: 0 };
				} else {
					return null;
				}
			},
		}) as ReferenceElement,
);

const isDynamicTrigger = computed(() =>
	(props.dynamicTriggers ?? []).includes(trigger.value ?? ""),
);

const list = computed(() => {
	const textarea = textareaRef.value?.$el;
	if (!textarea) return;

	const _list = getList(trigger.value, props.triggers);

	if (isDynamicTrigger.value) return _list;
	return _list.filter((item) => contains(String(item.value), searchValue.value));
});

watch(
	() => list.value?.length,
	() => {
		open.value = Boolean(list.value?.length);
	},
);

watch([trigger, searchValue], () => {
	if (isDynamicTrigger.value) emit("update:searchTerm", searchValue.value.replace(/^"/, ""));
});

function handleChange() {
	const text = value.value;
	const cursorOffset = getCursorOffset();
	const _trigger = getTrigger(text, cursorOffset, props.triggers);
	const _searchValue = getSearchValue(text, cursorOffset, props.triggers);
	if (_trigger !== null) {
		// in CQL mode only open the dropdown at natural token boundaries,
		// e.g. start of doc, after whitespace, or after "]"
		if (_trigger === "" && props.queryMode === "cql") {
			const charBefore = cursorOffset > 0 ? (text[cursorOffset - 1] ?? null) : null;
			if (charBefore !== null && !/[\s\]]/.test(charBefore)) {
				trigger.value = null;
				open.value = false;
				searchValue.value = _searchValue;
				return;
			}
		}
		trigger.value = _trigger;
		open.value = true;
	} else if (_searchValue == null) {
		trigger.value = null;
		open.value = false;
	}
	searchValue.value = _searchValue;

	if (_trigger === null) open.value = false;
}

function handleSelect(ev: CustomEvent) {
	highlighted.value = null;
	const cm = getCm();
	const textarea = textareaRef.value?.$el;

	if (!cm || !textarea) return;

	const cursorPos = cm.getCursor() ?? 0;
	const selectedValue = getValue(ev.detail.value, trigger.value, props.triggers)?.value;

	if (!selectedValue) return;

	// prevent setting `ComboboxInput`
	ev.preventDefault();

	// CQL keyword selection: insert [keyword=""] and place cursor between the quotes.
	if (props.queryMode === "cql" && (trigger.value === "[" || trigger.value === "")) {
		let keyword: string;
		let insertStart: number;
		let deleteLength: number;

		if (trigger.value === "[") {
			// Cursor is after "[" + searchValue; position of "[" = cursorPos - 1 - searchValue.length
			keyword = selectedValue.replace(/=$/, "");
			insertStart = Math.max(0, cursorPos - 1 - searchValue.value.length);
			deleteLength = 1 + searchValue.value.length;
		} else {
			// "" trigger: selectedValue is "[keyword=" (bracket-prefixed); insert at cursor
			keyword = selectedValue.slice(1, -1);
			insertStart = cursorPos;
			deleteLength = 0;
		}

		const inserted = `[${keyword}=""]`;
		const cursorPosition = insertStart + keyword.length + 3; // after [keyword="

		cm.replaceRange(inserted, insertStart, insertStart + deleteLength);
		cm.setCursor(cursorPosition);
		trigger.value = null;
		caretOffset.value = cursorPosition;
		nextTick().then(() => handleChange());
		return;
	}

	const offset = getTriggerOffset(value.value, cursorPos, props.triggers) - 1;
	value.value = replaceValue(
		value.value ?? "",
		offset,
		searchValue.value,
		selectedValue,
		trigger.value ?? "",
	);
	trigger.value = null;
	nextTick().then(() => {
		const end = value.value.length;
		cm.setCursor(end);
		caretOffset.value = end;
		handleChange();
	});
}

function submitSearch() {
	if (props.onSubmit) {
		props.onSubmit(value.value);
		return;
	}
	if (!props.table) return;
	parseSearchString(value.value, props.table);
	props.table.setGlobalFilter(normalizeParens(normalizeOperators(value.value)));
}

function clear() {
	value.value = "";
	open.value = false;
	submitSearch();
}

async function insertSnippet(snippet: string) {
	const cm = getCm();
	const textarea = textareaRef.value?.$el;
	if (!cm || !textarea) return;
	const cursorPos = cm.getCursor() ?? value.value.length;
	cm.replaceRange(snippet, cursorPos, cursorPos);
	const pos = cursorPos + snippet.length;
	cm.setCursor(pos);
	caretOffset.value = pos;
	await nextTick();
	handleChange();
}

defineExpose({ submitSearch, value, clear, insertSnippet });

onMounted(() => {
	if (props.table) value.value = props.table.getState().globalFilter;
	nextTick(() => (open.value = false));
});

watch(
	() => props.table?.getState().globalFilter,
	(newVal) => {
		if (newVal !== undefined) value.value = newVal;
	},
);

const queryWarnings = computed(() => {
	if (props.queryMode === "cql" || props.onSubmit)
		return { isValid: true, warnings: [] as Array<string> };
	return validateQuery(value.value);
});

const highlighted = ref<string | null>(null);
function setHighlight(el: { ref: HTMLElement; value: AcceptableValue } | undefined) {
	highlighted.value = el?.value ? String(el?.value) : null;
}
watch(open, () => (highlighted.value = null));

const eventListener = (e: KeyboardEvent) => {
	if (e.key === "Enter") {
		e.preventDefault();
		if (!highlighted.value && queryWarnings.value.isValid) submitSearch();
	}
};
onMounted(() => {
	window.addEventListener("keydown", eventListener);
});
onBeforeUnmount(() => {
	window.removeEventListener("keydown", eventListener);
});
</script>

<template>
	<ComboboxRoot
		v-model:open="open"
		class="flex w-full overflow-x-hidden"
		ignore-filter
		:reset-search-term-on-blur="false"
		@highlight="setHighlight"
	>
		<Label class="sr-only text-sm font-semibold" for="search"> search </Label>
		<ComboboxInput id="search" :as-child="true" autocomplete="off">
			<CodeMirror
				ref="textareaRef"
				v-model="value"
				class="min-h-10 w-full overflow-x-auto p-1"
				:extensions="cmExtensions"
				:lang="queryMode === 'cql' ? cqlLanguageSupport : queryLanguageSupport"
				:placeholder="
					queryMode === 'cql'
						? 'Type a CQL query, e.g. [word=&quot;…&quot; &amp; pos=&quot;…&quot;]'
						: 'Click to get a list of available features'
				"
				@input="() => handleChange()"
				@keydown.delete="
					() => {
						open = false;
						highlighted = null;
					}
				"
				@keydown.enter="eventListener"
				@keydown.left.right="open = false"
				@pointerdown="() => handleChange()"
			/>
		</ComboboxInput>
		<ComboboxAnchor :reference="reference" />
		<ComboboxPortal>
			<ComboboxContent
				v-if="list?.length"
				align="start"
				class="max-h-48 max-w-80 overflow-x-hidden overflow-y-auto rounded-md border border-neutral-500/30 bg-white p-1.5"
				position="popper"
				side="bottom"
			>
				<template v-for="(item, idx) in list" :key="String(item.value)">
					<ComboboxItem
						class="flex cursor-default rounded px-2 py-1 data-highlighted:bg-muted"
						:value="item.value"
						@select="handleSelect"
					>
						<span class="truncate whitespace-pre">{{ item.displayValue }}</span>
					</ComboboxItem>
					<ComboboxSeparator
						v-if="item.value.startsWith('ft') && !list[idx + 1]?.value.startsWith('ft')"
						><span>&nbsp;</span></ComboboxSeparator
					>
				</template>
			</ComboboxContent>
		</ComboboxPortal>
	</ComboboxRoot>
</template>

<style>
@reference "@/styles/index.css";

.cm-content {
	white-space: unset !important;
}

.cm-scroller {
	font-family: inherit !important;
}

.cm-feature {
	@apply text-amber-900;
}

.cm-filter {
	@apply text-amber-900;
}

.cm-feature-value {
	@apply text-amber-700 font-medium;
}

.cm-operator {
	@apply text-on-muted text-xs font-bold uppercase;
}

.cm-tooltip {
	@apply p-1 bg-white! rounded text-xs;
}
</style>
