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
	setEndOfContenteditable,
	type TriggerMap,
} from "./index.ts";
import { queryHighlightStyle, queryLanguageSupport, wordHover } from "./query-language.ts";

const props = defineProps<{
	table: Table<unknown>;
	triggers: TriggerMap;
}>();

const { parseSearchString, validateQuery, normalizeOperators, normalizeParens } = useFilterParser();

const { contains } = useFilter({ sensitivity: "base" });

const cmExtensions = computed(() => [
	queryLanguageSupport,
	wordHover(props.triggers),
	syntaxHighlighting(queryHighlightStyle),
	tooltips({ parent: document.body }),
]);

const value = ref("");
const trigger = ref<string | null>(null);
const caretOffset = ref<number | null>(null);
const open = ref(false);
const searchValue = ref("");

const textareaRef = ref<InstanceType<typeof ComboboxInput>>();

const reference = computedWithControl(
	() => [searchValue.value, open.value],
	() =>
		({
			getBoundingClientRect: () => {
				if (textareaRef.value?.$el) {
					const { x, y, height } = getAnchorRect(textareaRef.value?.$el, props.triggers);
					return { x, y, height, top: y, left: x, width: 0 };
				} else {
					return null;
				}
			},
		}) as ReferenceElement,
);

const list = computed(() => {
	const textarea = textareaRef.value?.$el;
	if (!textarea) return;

	const _list = getList(trigger.value, props.triggers);
	return _list.filter((item) => contains(String(item.value), searchValue.value));
});

watch(
	() => list.value?.length,
	() => {
		open.value = Boolean(list.value?.length);
	},
);

function handleChange(ev: InputEvent | PointerEvent) {
	const target = ev.target as HTMLTextAreaElement;
	const _trigger = getTrigger(target, props.triggers);
	const _searchValue = getSearchValue(target, props.triggers);
	if (_trigger !== null) {
		trigger.value = _trigger;
		open.value = true;
	} else if (_searchValue == null) {
		trigger.value = null;
		open.value = false;
	}
	// value.value = target.textContent;
	searchValue.value = _searchValue;

	if (_trigger === null) open.value = false;
}

function handleSelect(ev: CustomEvent) {
	highlighted.value = null;
	const textarea = textareaRef.value?.$el;

	if (!textarea) return;

	const offset = getTriggerOffset(textarea, props.triggers) - 1;
	const selectedValue = getValue(ev.detail.value, trigger.value, props.triggers)?.value;

	if (!selectedValue) return;

	// prevent setting `ComboboxInput`
	ev.preventDefault();
	value.value = replaceValue(
		value.value ?? "",
		offset,
		searchValue.value,
		selectedValue,
		trigger.value ?? "",
	);
	trigger.value = null;
	const nextCaretOffset = offset + selectedValue?.length;
	caretOffset.value = nextCaretOffset;

	nextTick().then(() => {
		setEndOfContenteditable(textarea);
		handleChange({ target: textarea } as InputEvent);
	});
}

function submitSearch() {
	parseSearchString(value.value, props.table);
	props.table.setGlobalFilter(normalizeParens(normalizeOperators(value.value)));
}

function clear() {
	value.value = "";
	open.value = false;
	submitSearch();
}

defineExpose({ submitSearch, value, clear });

onMounted(() => {
	value.value = props.table.getState().globalFilter;
	nextTick(() => (open.value = false));
});

watch(
	() => props.table.getState().globalFilter,
	(newVal) => {
		value.value = newVal;
	},
);

const queryWarnings = computed(() => validateQuery(value.value));

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
				:lang="queryLanguageSupport"
				placeholder="Click to get a list of available features"
				@input="handleChange"
				@keydown.delete="
					() => {
						open = false;
						highlighted = null;
					}
				"
				@keydown.enter="eventListener"
				@keydown.left.right="open = false"
				@pointerdown="(e: PointerEvent) => handleChange(e)"
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
						class="flex cursor-default rounded-sm px-2 py-1 data-highlighted:bg-muted"
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
