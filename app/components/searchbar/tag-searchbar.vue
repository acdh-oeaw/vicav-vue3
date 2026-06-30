<script setup lang="ts">
import { X } from "@lucide/vue";
import type { Table } from "@tanstack/vue-table";
import {
	type AcceptableValue,
	ComboboxAnchor,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxPortal,
	ComboboxRoot,
	type ReferenceElement,
	useFilter,
} from "reka-ui";
import { computed, nextTick, ref, watch } from "vue";

import {
	buildRawValue,
	flatRender,
	getFlatTags,
	type Operator,
	OPERATORS,
	parseTagClause,
	splitQueryIntoTokens,
	type TagItem,
	tokenToTagItem,
	type TriggerMap,
} from "./index.ts";

const props = defineProps<{
	table: Table<unknown>;
	triggers: TriggerMap;
}>();

const { parseSearchString, validateQuery, normalizeOperators, normalizeParens } = useFilterParser();
const { contains } = useFilter({ sensitivity: "base" });

const tags = ref<Array<TagItem>>([]);
const inputValue = ref("");
const open = ref(false);
const highlighted = ref<string | null>(null);
const editingTagId = ref<string | null>(null);

// ---- Display value (computed reactively from triggers) ----

function getDisplayValue(clause: string): string {
	let prefix = "";
	let rest = clause.trim();

	if (rest.toUpperCase().startsWith("NOT ")) {
		prefix = "NOT ";
		rest = rest.slice(4).trim();
	}

	if (rest.startsWith("(")) return clause;

	const colonIdx = rest.indexOf(":");
	if (colonIdx === -1) return clause;

	const featureKey = rest.slice(0, colonIdx + 1); // e.g. "ft_q:"
	const rawVal = rest.slice(colonIdx + 1); // e.g. '"Cairene"' or 'ANY'

	const featureDisplayRaw =
		props.triggers.get("")?.find((f) => f.value === featureKey)?.displayValue ??
		featureKey.replace(":", "");

	const featureDisplay = featureDisplayRaw
		? featureDisplayRaw.charAt(0).toUpperCase() + featureDisplayRaw.slice(1)
		: featureDisplayRaw;

	const valueDisplay =
		props.triggers.get(featureKey)?.find((v) => v.value === rawVal)?.displayValue ??
		rawVal.replace(/^"|"$/g, "");

	return `${prefix}${featureDisplay}: ${valueDisplay}`;
}

function addTag(rawValue: string, operator?: Operator) {
	const trimmed = rawValue.trim();
	if (!trimmed) return;
	tags.value.push(tokenToTagItem(trimmed, tags.value.length > 0 ? (operator ?? "AND") : undefined));
}

function findInList(list: Array<TagItem>, id: string): TagItem | null {
	for (const tag of list) {
		if (tag.id === id) return tag;
		if (tag.children) {
			const found = findInList(tag.children, id);
			if (found) return found;
		}
	}
	return null;
}

function removeInList(list: Array<TagItem>, id: string): boolean {
	for (let i = 0; i < list.length; i++) {
		if (list[i]!.id === id) {
			if (i === 0 && list.length > 1) list[1]!.operator = undefined;
			list.splice(i, 1);
			return true;
		}
		if (list[i]!.children) {
			const removed = removeInList(list[i]!.children!, id);
			if (removed) {
				if (list[i]!.children!.length === 0) {
					if (i === 0 && list.length > 1) list[1]!.operator = undefined;
					list.splice(i, 1);
				}
				return true;
			}
		}
	}
	return false;
}

function removeById(id: string) {
	removeInList(tags.value, id);
	submitSearch();
}

function updateOperator(id: string, operator: Operator) {
	const tag = findInList(tags.value, id);
	if (tag) {
		tag.operator = operator;
		submitSearch();
	}
}

function clear() {
	tags.value = [];
	inputValue.value = "";
	editingTagId.value = null;
	open.value = false;
	submitSearch();
	reference.value = inputRef.value?.$el;
}

const value = computed({
	get() {
		return buildRawValue(tags.value);
	},
	set(newVal: string) {
		if (!newVal?.trim()) {
			tags.value = [];
			return;
		}
		tags.value = splitQueryIntoTokens(newVal).map((token, i) =>
			tokenToTagItem(
				token.clause,
				i > 0 ? ((token.operator as Operator | undefined) ?? "AND") : undefined,
			),
		);
	},
});

function parseInputTrigger(inputVal: string): { trigger: string; searchValue: string } {
	const nonEmptyTriggers = [...props.triggers.keys()]
		.filter((t) => t !== "")
		.sort((a, b) => b.length - a.length);

	for (const trigger of nonEmptyTriggers) {
		const idx = inputVal.lastIndexOf(trigger);
		if (idx !== -1) {
			return { trigger, searchValue: inputVal.slice(idx + trigger.length) };
		}
	}
	return { trigger: "", searchValue: inputVal };
}

const currentTrigger = computed(() => parseInputTrigger(inputValue.value).trigger);
const currentSearchValue = computed(() => parseInputTrigger(inputValue.value).searchValue);
const flatTags = computed(() => tags.value.flatMap((tag) => getFlatTags(tag)));
const renderTokens = computed(() => flatRender(tags.value));
const editingTag = computed(
	() => flatTags.value.find((tag) => tag.id === editingTagId.value) ?? null,
);
const editingTagClause = computed(() =>
	editingTag.value ? parseTagClause(editingTag.value.rawValue) : null,
);
const activeTrigger = computed(() => editingTagClause.value?.featureKey ?? currentTrigger.value);
const activeSearchValue = computed(() => (editingTagClause.value ? "" : currentSearchValue.value));

const filteredList = computed(() => {
	const list = props.triggers.get(activeTrigger.value) ?? [];
	const search = activeSearchValue.value;
	return list.filter(
		(item) => contains(item.displayValue, search) || contains(String(item.value), search),
	);
});

watch(
	() => filteredList.value.length,
	(len) => {
		open.value = len > 0;
	},
);

function handleInput() {
	editingTagId.value = null;
	open.value = filteredList.value.length > 0;
}

function handleSelect(ev: CustomEvent) {
	ev.preventDefault();
	highlighted.value = null;
	const selectedValue = String(ev.detail.value);

	if (editingTag.value && editingTagClause.value) {
		editingTag.value.rawValue = `${editingTagClause.value.prefix}${editingTagClause.value.featureKey}${selectedValue}`;
		editingTagId.value = null;
		inputValue.value = "";
		open.value = false;
		submitSearch();
	} else if (currentTrigger.value === "") {
		// A feature key was selected — populate the input so the user can pick a value
		inputValue.value = selectedValue;
		open.value = false;
		nextTick(() => {
			if (filteredList.value.length > 0) open.value = true;
		});
	} else {
		// A value was selected — create a complete tag
		addTag(`${currentTrigger.value}${selectedValue}`);
		inputValue.value = "";
		open.value = false;
		submitSearch();
	}
	reference.value = inputRef.value?.$el;
}

function handleTagClick(tag: TagItem, referenceItem?: ReferenceElement) {
	const parsedClause = parseTagClause(tag.rawValue);
	if (!parsedClause) return;
	editingTagId.value = tag.id;
	if (referenceItem) reference.value = referenceItem;
	open.value = true;
}

function handleBackspace() {
	if (inputValue.value === "" && tags.value.length > 0) {
		tags.value.pop();
	}
}

function handleEnter(e: KeyboardEvent) {
	e.preventDefault();
	if (highlighted.value) return; // let combobox handle selection
	if (inputValue.value.trim()) {
		addTag(inputValue.value.trim());
		inputValue.value = "";
		open.value = false;
	} else if (queryWarnings.value.isValid) {
		submitSearch();
	}
}

function handlePaste(e: ClipboardEvent) {
	e.preventDefault();
	const text = e.clipboardData?.getData("text") ?? "";
	if (!text) return;

	const combined = inputValue.value + text;
	const tokens = splitQueryIntoTokens(combined);

	if (tokens.length > 1) {
		tokens.forEach((token, i) =>
			addTag(token.clause, i > 0 ? (token.operator as Operator | undefined) : undefined),
		);
		inputValue.value = "";
		open.value = false;
	} else {
		inputValue.value = combined;
		handleInput();
	}
}

function setHighlight(el: { ref: HTMLElement; value: AcceptableValue } | undefined) {
	highlighted.value = el?.value ? String(el.value) : null;
}

watch(open, () => {
	highlighted.value = null;
	if (!open.value) {
		editingTagId.value = null;
		reference.value = inputRef.value?.$el;
	}
});

function submitSearch() {
	parseSearchString(value.value, props.table);
	props.table.setGlobalFilter(normalizeParens(normalizeOperators(value.value)));
}

const queryWarnings = computed(() => validateQuery(value.value));

onMounted(() => {
	const globalFilter = props.table.getState().globalFilter;
	if (globalFilter) value.value = globalFilter;
});

watch(
	() => props.table.getState().globalFilter,
	(newVal) => {
		if (newVal !== value.value) value.value = newVal ?? "";
	},
);

const keyListener = (e: KeyboardEvent) => {
	if (e.key === "Enter" && !highlighted.value && queryWarnings.value.isValid) {
		submitSearch();
	}
};
onMounted(() => window.addEventListener("keydown", keyListener));
onBeforeUnmount(() => window.removeEventListener("keydown", keyListener));

defineExpose({ submitSearch, value, clear });

const inputRef = useTemplateRef("inputRef");
const reference = ref<ReferenceElement>();
onMounted(() => {
	if (inputRef.value && value.value.length === 0) {
		reference.value = inputRef.value.$el;
	}
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
		<div class="flex min-h-10 w-full flex-wrap items-center gap-1 p-1.5">
			<template v-for="token in renderTokens" :key="`${token.tag.id}-${token.kind}`">
				<span id="operatorSelect" class="sr-only">Operator</span>
				<Select
					v-if="token.kind === 'operator'"
					aria-labelledby="operatorSelect"
					:model-value="token.tag.operator"
					@update:model-value="(val: string) => updateOperator(token.tag.id, val as Operator)"
				>
					<SelectTrigger
						class="h-5 w-auto gap-0.5 rounded-sm border-none px-1.5 text-xs font-semibold text-on-muted shadow-none focus:ring-0"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent class="min-w-28 bg-white">
						<SelectItem v-for="op in OPERATORS" :key="op" class="text-xs" :value="op">
							{{ op }}
						</SelectItem>
					</SelectContent>
				</Select>

				<span
					v-else-if="token.kind === 'open-paren'"
					class="text-sm font-semibold text-on-muted select-none"
					>(</span
				>

				<template v-else-if="token.kind === 'close-paren'">
					<span class="text-sm font-semibold text-on-muted select-none">)</span>
				</template>

				<div
					v-else
					class="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm font-medium transition hover:bg-muted/80"
					role="button"
					tabindex="0"
					@click="(e) => handleTagClick(token.tag, e.target as ReferenceElement)"
					@keydown.enter.prevent="(e) => handleTagClick(token.tag, e.target as ReferenceElement)"
					@keydown.space.prevent="(e) => handleTagClick(token.tag, e.target as ReferenceElement)"
				>
					<span class="max-w-48 truncate capitalize" :title="getDisplayValue(token.tag.rawValue)">
						{{ getDisplayValue(token.tag.rawValue) }}
					</span>
					<Button
						class="h-full p-0 text-on-muted transition"
						variant="ghost"
						@click="removeById(token.tag.id)"
						@click.stop
					>
						<X class="size-3" />
					</Button>
				</div>
			</template>

			<ComboboxInput
				ref="inputRef"
				v-model="inputValue"
				autocomplete="off"
				class="min-w-24 flex-1 bg-transparent text-sm outline-none"
				:placeholder="tags.length === 0 ? 'Type to search features…' : ''"
				@click="open = !open"
				@input="handleInput"
				@keydown.backspace="handleBackspace"
				@keydown.enter="handleEnter"
				@keydown.left.right="open = false"
				@paste="handlePaste"
			/>

			<ComboboxAnchor :reference="reference" />
		</div>
		<ComboboxPortal>
			<ComboboxContent
				v-if="filteredList.length"
				align="start"
				class="max-h-48 max-w-80 overflow-x-hidden overflow-y-auto rounded-md border border-neutral-500/30 bg-white p-1.5"
				position="popper"
				side="bottom"
			>
				<template v-for="(item, idx) in filteredList" :key="String(item.value)">
					<ComboboxItem
						class="flex cursor-default rounded-sm px-2 py-1 data-highlighted:bg-muted"
						:value="item.value"
						@select="handleSelect"
					>
						<span class="truncate whitespace-pre">{{ item.displayValue }}</span>
					</ComboboxItem>
					<ComboboxSeparator
						v-if="
							String(item.value).startsWith('ft') &&
							!String(filteredList[idx + 1]?.value ?? '').startsWith('ft')
						"
					>
						<span>&nbsp;</span>
					</ComboboxSeparator>
				</template>
			</ComboboxContent>
		</ComboboxPortal>
	</ComboboxRoot>
</template>
