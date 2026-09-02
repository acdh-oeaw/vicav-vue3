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
	OPERATORS,
	parseTagClause,
	splitCqlQuery,
	splitQueryIntoTokens,
	type TagItem,
	tokenToTagItem,
	type TriggerMap,
} from "./index.ts";

const props = defineProps<{
	table?: Table<unknown>;
	triggers: TriggerMap;
	operators?: ReadonlyArray<string>;
	featureTrigger?: string;
	onSubmit?: (value: string) => void;
	freeTriggerKey?: string;
	dynamicTriggers?: ReadonlyArray<string>;
}>();

const emit = defineEmits<{ "update:searchTerm": [value: string] }>();

const { parseSearchString, validateQuery, normalizeOperators, normalizeParens } = useFilterParser();
const { contains } = useFilter({ sensitivity: "base" });

const tags = ref<Array<TagItem>>([]);
const inputValue = ref("");
const open = ref(false);
const highlighted = ref<string | null>(null);
const editingTagId = ref<string | null>(null);

const cursorPos = ref<number | null>(null);

const isCqlMode = computed(() => (props.featureTrigger ?? "") === "[");
const activeOperators = computed(() => props.operators ?? OPERATORS);

function buildCqlTag(raw: string): string {
	const trimmed = raw.trim();
	return trimmed.startsWith("[") && !trimmed.endsWith("]") ? `${trimmed}]` : trimmed;
}

function getCqlDisplayValue(clause: string): string {
	const trimmed = clause.trim();
	const inner = trimmed.startsWith("[")
		? trimmed.endsWith("]")
			? trimmed.slice(1, -1)
			: trimmed.slice(1)
		: trimmed;

	if (props.freeTriggerKey) {
		const m = new RegExp(`^${props.freeTriggerKey}="(.+)"$`).exec(inner);
		if (m) return (m[1] ?? "").split("|").join(" | ");
	}

	if (/[&|]/.test(inner)) return inner;

	const eqIdx = inner.indexOf("=");
	if (eqIdx === -1) return inner;

	const keyword = inner.slice(0, eqIdx).trim();
	const rawVal = inner.slice(eqIdx + 1).trim(); // e.g. '"v.*"'
	const valueDisplay = rawVal.replace(/^"|"$/g, "");

	const triggerKey = `[${keyword}=`;
	const keywordDisplay =
		props.triggers.get("[")?.find((t) => t.value === `${keyword}=`)?.displayValue ?? keyword;
	const knownValueDisplay = props.triggers
		.get(triggerKey)
		?.find((v) => v.value === rawVal)?.displayValue;

	return `${keywordDisplay}: ${knownValueDisplay ?? valueDisplay}`;
}

/** Merges `word` into the last tag if it is a freeTriggerKey token. Returns true on success. */
function tryMergeFreeWord(word: string): boolean {
	if (!props.freeTriggerKey) return false;
	const last = tags.value.at(-1);
	if (!last || last.children) return false;
	const m = new RegExp(`^\\[${props.freeTriggerKey}="(.+)"\\]$`).exec(last.rawValue);
	if (!m) return false;
	last.rawValue = `[${props.freeTriggerKey}="${m[1] ?? ""}|${word}"]`;
	return true;
}

function getDisplayValue(clause: string): string {
	let prefix = "";
	let rest = clause.trim();

	if (rest.toUpperCase().startsWith("NOT ")) {
		prefix = "NOT ";
		rest = rest.slice(4).trim();
	}

	if (rest.startsWith("(")) return clause;

	// CQL format: [keyword="value"]
	if (rest.startsWith("[")) {
		return `${prefix}${getCqlDisplayValue(rest)}`;
	}

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

function addTag(rawValue: string, operator?: string) {
	const trimmed = rawValue.trim();
	if (!trimmed) return;

	const defaultOp = isCqlMode.value ? undefined : (activeOperators.value[0] ?? "AND");
	tags.value.push(
		tokenToTagItem(trimmed, tags.value.length > 0 ? (operator ?? defaultOp) : undefined),
	);
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

function updateOperator(id: string, operator: string) {
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

async function insertSnippet(snippet: string) {
	const el = inputRef.value?.$el as HTMLInputElement | undefined;
	const start = el?.selectionStart ?? inputValue.value.length;
	const end = el?.selectionEnd ?? start;
	inputValue.value = inputValue.value.slice(0, start) + snippet + inputValue.value.slice(end);
	const pos = start + snippet.length;
	await nextTick();
	if (el) {
		el.focus();
		el.setSelectionRange(pos, pos);
	}
	handleInput();
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
		if (isCqlMode.value) {
			tags.value = splitCqlQuery(newVal).map((token) => tokenToTagItem(token.clause, undefined));
		} else {
			const defaultOp = activeOperators.value[0] ?? "AND";
			tags.value = splitQueryIntoTokens(newVal).map((token, i) =>
				tokenToTagItem(token.clause, i > 0 ? (token.operator ?? defaultOp) : undefined),
			);
		}
	},
});

function parseInputTrigger(
	inputVal: string,
	upTo?: number,
): { trigger: string; searchValue: string } {
	const segment = inputVal.slice(0, upTo ?? inputVal.length);
	const nonEmptyTriggers = [...props.triggers.keys()]
		.filter((t) => t !== "")
		.sort((a, b) => b.length - a.length);

	for (const trigger of nonEmptyTriggers) {
		const idx = segment.lastIndexOf(trigger);
		if (idx !== -1) {
			return { trigger, searchValue: segment.slice(idx + trigger.length) };
		}
	}
	return { trigger: "", searchValue: segment };
}

const currentTrigger = computed(
	() => parseInputTrigger(inputValue.value, cursorPos.value ?? undefined).trigger,
);
const currentSearchValue = computed(
	() => parseInputTrigger(inputValue.value, cursorPos.value ?? undefined).searchValue,
);
const flatTags = computed(() => tags.value.flatMap((tag) => getFlatTags(tag)));
const renderTokens = computed(() => flatRender(tags.value));
const editingTag = computed(
	() => flatTags.value.find((tag) => tag.id === editingTagId.value) ?? null,
);
const editingTagClause = computed(() =>
	editingTag.value ? parseTagClause(editingTag.value.rawValue) : null,
);

// In CQL mode, plain text typed without a "[" is free-text input. We surface it as if the
// user were filling the freeTriggerKey's value list, so the same (dynamic) suggestions appear.
const freeTextTrigger = computed(() => `[${props.freeTriggerKey}=`);
const isFreeTextInput = computed(
	() =>
		isCqlMode.value &&
		Boolean(props.freeTriggerKey) &&
		!editingTagClause.value &&
		currentTrigger.value === "" &&
		Boolean(inputValue.value) &&
		!inputValue.value.trim().startsWith("["),
);

const activeTrigger = computed(() => {
	if (editingTagClause.value) return editingTagClause.value.featureKey;
	if (isFreeTextInput.value) return freeTextTrigger.value;
	return currentTrigger.value;
});
const activeSearchValue = computed(() => (editingTagClause.value ? "" : currentSearchValue.value));

const showKeywordsOnEmpty = computed(
	() => isCqlMode.value && !editingTagClause.value && !inputValue.value,
);

const isDynamicTrigger = computed(() =>
	(props.dynamicTriggers ?? []).includes(activeTrigger.value),
);

const filteredList = computed(() => {
	const triggerKey = showKeywordsOnEmpty.value ? "[" : activeTrigger.value;
	const list = props.triggers.get(triggerKey) ?? [];

	if (isDynamicTrigger.value) return list;
	const search = activeSearchValue.value;
	return list.filter(
		(item) => contains(item.displayValue, search) || contains(String(item.value), search),
	);
});

watch([activeTrigger, activeSearchValue], () => {
	if (isDynamicTrigger.value) emit("update:searchTerm", activeSearchValue.value.replace(/^"/, ""));
});

watch(
	() => filteredList.value.length,
	(len) => {
		open.value = len > 0;
	},
);

function updateCursorPos() {
	cursorPos.value = (inputRef.value?.$el as HTMLInputElement | null)?.selectionStart ?? null;
}

function handleInput() {
	editingTagId.value = null;
	updateCursorPos();
	open.value = filteredList.value.length > 0;
}

function handleSelect(ev: CustomEvent) {
	ev.preventDefault();
	highlighted.value = null;
	const selectedValue = String(ev.detail.value);
	const featureTriggerValue = props.featureTrigger ?? "";

	// Free-text suggestion picked: wrap the chosen word as a freeTriggerKey token (merging
	// into a previous free-text tag when possible), mirroring handleEnter's free-text path.
	if (isFreeTextInput.value) {
		const word = selectedValue.replace(/^"|"$/g, "");
		if (!tryMergeFreeWord(word)) addTag(`[${props.freeTriggerKey}="${word}"]`);
		inputValue.value = "";
		open.value = false;
		submitSearch();
		reference.value = inputRef.value?.$el;
		return;
	}

	if (editingTag.value && editingTagClause.value) {
		let rawVal = `${editingTagClause.value.prefix}${editingTagClause.value.featureKey}${selectedValue}`;
		if (isCqlMode.value) rawVal = buildCqlTag(rawVal);
		editingTag.value.rawValue = rawVal;
		editingTagId.value = null;
		inputValue.value = "";
		open.value = false;
		submitSearch();
	} else if (
		currentTrigger.value === featureTriggerValue ||
		(isCqlMode.value && currentTrigger.value === "")
	) {
		if (isCqlMode.value) {
			// Build the canonical "[keyword=" prefix from either trigger source
			const prefix =
				currentTrigger.value === featureTriggerValue
					? featureTriggerValue + selectedValue
					: selectedValue; // "" trigger: value is already "[word="

			const keyword = prefix.replace(/^\[/, "").replace(/=$/, "");

			inputValue.value = `[${keyword}=""]`;
			const pos = `[${keyword}="`.length;
			cursorPos.value = pos;
			open.value = false;
			nextTick(() => {
				const el = inputRef.value?.$el as HTMLInputElement | undefined;
				if (el) {
					el.setSelectionRange(pos, pos);
					el.focus();
				}
				// For keywords with predefined values the filteredList is now non-empty
				// (searchValue = '"' matches all quoted values); open the dropdown.
				if (filteredList.value.length > 0) open.value = true;
			});
		} else {
			// Lucene: populate input with the feature key so the value dropdown opens
			inputValue.value = featureTriggerValue + selectedValue;
			const pos = inputValue.value.length;
			cursorPos.value = pos;
			open.value = false;
			nextTick(() => {
				const el = inputRef.value?.$el as HTMLInputElement | undefined;
				if (el) {
					el.setSelectionRange(pos, pos);
					el.focus();
				}
				if (filteredList.value.length > 0) open.value = true;
			});
		}
	} else {
		let tagValue = `${currentTrigger.value}${selectedValue}`;
		if (isCqlMode.value) tagValue = buildCqlTag(tagValue);
		addTag(tagValue);
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
		let tagValue = inputValue.value.trim();
		if (isCqlMode.value) {
			tagValue = buildCqlTag(tagValue);
			// Free-text entry: wrap in [freeTriggerKey="…"] and merge with previous if applicable
			if (!tagValue.startsWith("[") && props.freeTriggerKey) {
				if (!tryMergeFreeWord(tagValue)) {
					addTag(`[${props.freeTriggerKey}="${tagValue}"]`);
				}
				inputValue.value = "";
				open.value = false;
				return;
			}
		}
		addTag(tagValue);
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

	if (isCqlMode.value) {
		const tokens = splitCqlQuery(combined);
		if (tokens.length > 1) {
			tokens.forEach((token) => addTag(token.clause));
			inputValue.value = "";
			open.value = false;
		} else {
			inputValue.value = combined;
			handleInput();
		}
	} else {
		const tokens = splitQueryIntoTokens(combined);
		if (tokens.length > 1) {
			const defaultOp = activeOperators.value[0] ?? "AND";
			tokens.forEach((token, i) =>
				addTag(token.clause, i > 0 ? (token.operator ?? defaultOp) : undefined),
			);
			inputValue.value = "";
			open.value = false;
		} else {
			inputValue.value = combined;
			handleInput();
		}
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
	if (props.onSubmit) {
		props.onSubmit(value.value);
		return;
	}
	if (!props.table) return;
	parseSearchString(value.value, props.table);
	props.table.setGlobalFilter(normalizeParens(normalizeOperators(value.value)));
}

const queryWarnings = computed(() => {
	if (props.onSubmit) return { isValid: true, warnings: [] as Array<string> };
	return validateQuery(value.value);
});

onMounted(() => {
	const globalFilter = props.table?.getState().globalFilter;
	if (globalFilter) value.value = globalFilter;
});

watch(
	() => props.table?.getState().globalFilter,
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

defineExpose({ submitSearch, value, clear, insertSnippet });

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
					@update:model-value="(val: string) => updateOperator(token.tag.id, val)"
				>
					<SelectTrigger
						class="h-5 w-auto gap-0.5 rounded-sm border-none px-1.5 text-xs font-semibold text-on-muted shadow-none focus:ring-0"
						data-onboarding="query-operator"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent class="min-w-28 bg-white">
						<SelectItem v-for="op in activeOperators" :key="op" class="text-xs" :value="op">
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
				:placeholder="
					tags.length === 0
						? isCqlMode
							? 'Click or type [ to add a token…'
							: 'Type to search…'
						: ''
				"
				@click="
					() => {
						open = !open;
						updateCursorPos();
					}
				"
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
