<script setup lang="ts">
import { syntaxHighlighting } from "@codemirror/language";
import { tooltips } from "@codemirror/view";
import type { Table } from "@tanstack/vue-table";
import { computedWithControl } from "@vueuse/core";
import { ChevronDown, FunnelPlus, X } from "lucide-vue-next";
import {
	type AcceptableValue,
	ComboboxAnchor,
	ComboboxCancel,
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

const { parseSearchString, validateQuery, normalizeOperators, addMetaFilter } = useFilterParser();

const { contains } = useFilter({ sensitivity: "base" });

const cmExtensions = computed(() => [
	queryLanguageSupport,
	wordHover(props.triggers),
	syntaxHighlighting(queryHighlightStyle),
	tooltips({ parent: document.body }),
]);

console.log(props.triggers);

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
	props.table.setGlobalFilter(normalizeOperators(value.value));
}

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

const { metaInfo } = useWibarabTriggers();
const isMetaMenuOpen = ref([...metaInfo.value.keys()].map(() => false));
function addMetaFilterToQuery(key: string, val: string) {
	value.value = addMetaFilter(value.value, key, val);
	submitSearch();
}

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
	<div class="grid w-full max-w-full grid-cols-[1fr_auto_auto] gap-x-2 overflow-x-hidden">
		<ComboboxRoot
			v-model:open="open"
			class="flex w-full flex-col overflow-x-hidden"
			ignore-filter
			:reset-search-term-on-blur="false"
			@highlight="setHighlight"
		>
			<Label class="sr-only text-sm font-semibold" for="search"> search </Label>

			<div class="flex w-full rounded-md border border-muted">
				<ComboboxInput id="search" :as-child="true" autocomplete="off" class="w-full p-2">
					<CodeMirror
						ref="textareaRef"
						v-model="value"
						class="w-full overflow-x-auto p-2"
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
						@pointerdown="
							(e: PointerEvent) => {
								handleChange(e);
								// open = false;
							}
						"
					/>
				</ComboboxInput>
				<ComboboxCancel as-child>
					<Button
						class="self-center p-2"
						variant="ghost"
						@click="
							value = '';
							submitSearch();
						"
						><X class="size-4"></X
					></Button>
				</ComboboxCancel>
			</div>
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
		<DropdownMenu>
			<DropdownMenuTrigger as-child
				><Button
					class="h-full self-end"
					:disabled="!(value?.length > 0 && queryWarnings.isValid)"
					variant="outline"
					@click="submitSearch"
					><FunnelPlus class="size-4" /></Button
			></DropdownMenuTrigger>

			<DropdownMenuContent class="max-h-[var(--radix-dropdown-menu-content-available-height)] w-52">
				<Collapsible
					v-for="([key, val], idx) in metaInfo"
					:key="key"
					v-model:open="isMetaMenuOpen[idx]"
				>
					<CollapsibleTrigger class="flex w-full items-center gap-1 p-2 text-sm">
						<span class="capitalize">{{ key }}</span>
						<ChevronDown
							class="size-4"
							:class="isMetaMenuOpen[idx] ? 'rotate-180' : ''"
						></ChevronDown>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<Button
							v-for="entry in val.toSorted((a, b) => a.displayValue.localeCompare(b.displayValue))"
							:key="entry.value"
							class="h-auto w-full justify-start p-1 pl-4 text-start text-sm font-normal whitespace-normal"
							variant="ghost"
							@click="() => addMetaFilterToQuery(key, entry.value)"
							>{{ entry.displayValue }}</Button
						>
					</CollapsibleContent>
				</Collapsible>
			</DropdownMenuContent>
		</DropdownMenu>
		<Button class="h-full self-end" variant="outline" @click="submitSearch">Search</Button>
		<div v-if="queryWarnings.warnings.length" class="mt-1 ml-1 text-xs text-orange-700">
			<div v-for="(warning, idx) in queryWarnings.warnings" :key="idx">{{ warning }}</div>
		</div>
		<div
			v-else-if="!table.getFilteredRowModel().flatRows.length"
			class="mt-1 ml-1 text-xs text-on-muted"
		>
			Your query returned no results.
		</div>
	</div>
</template>

<style>
@reference "@/styles/index.css";

.cm-scroller {
	font-family: inherit !important;
}

.cm-feature {
	@apply text-amber-900;
}

.cm-filter {
	@apply text-amber-900;
}

.cm-filter::before {
	@apply mr-0.5 opacity-80;

	content: "🛈";
}

/* .cm-feature::before {
	@apply bg-emerald-900 inline-block size-2 rounded-full mr-1;

	content: "";
} */

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
