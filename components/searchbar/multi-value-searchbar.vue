<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";
import { computedWithControl } from "@vueuse/core";
import { ChevronDown, FunnelPlus, X } from "lucide-vue-next";
import {
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
import { computed, nextTick, ref, watch, watchEffect } from "vue";

import {
	getAnchorRect,
	getList,
	getSearchValue,
	getTrigger,
	getTriggerOffset,
	getValue,
	replaceValue,
	type TriggerMap,
} from ".";

const props = defineProps<{
	table: Table<unknown>;
	triggers: TriggerMap;
}>();

const { parseSearchString, validateQuery, normalizeOperators, addMetaFilter } = useFilterParser();

const { contains } = useFilter({ sensitivity: "base" });

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

watchEffect(() => {
	const textarea = textareaRef.value?.$el as HTMLTextAreaElement | undefined;
	if (caretOffset.value !== null && textarea) {
		textarea.setSelectionRange(caretOffset.value, caretOffset.value);
	}
});

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

	value.value = target.value;
	searchValue.value = _searchValue;

	if (_trigger === null) open.value = false;
}

function handleSelect(ev: CustomEvent) {
	const textarea = textareaRef.value?.$el;

	if (!textarea) return;

	const offset = getTriggerOffset(textarea, props.triggers) - 1;
	const selectedValue = getValue(ev.detail.value, trigger.value, props.triggers)?.value;

	if (!selectedValue) return;

	// prevent setting `ComboboxInput`
	ev.preventDefault();

	value.value = replaceValue(
		value.value,
		offset,
		searchValue.value,
		selectedValue,
		trigger.value ?? "",
	);

	trigger.value = null;
	const nextCaretOffset = offset + selectedValue.length;
	caretOffset.value = nextCaretOffset;

	nextTick().then(() => {
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
</script>

<template>
	<div class="grid w-full grid-cols-[1fr_auto_auto] gap-x-2">
		<ComboboxRoot
			v-model:open="open"
			class="flex w-full flex-col"
			ignore-filter
			:reset-search-term-on-blur="false"
		>
			<Label class="sr-only text-sm font-semibold" for="search"> search </Label>

			<div class="relative w-full rounded-md border border-muted flex">
				<ComboboxInput
					id="search"
					ref="textareaRef"
					v-model="value"
					as="input"
					autocomplete="off"
					class="p-2 w-full"
					placeholder="Click to get a list of available features"
					rows="5"
					@input="handleChange"
					@keydown.enter="
						(ev: KeyboardEvent) => {
							if (open) ev.preventDefault();
						}
					"
					@keydown.left.right="open = false"
					@pointerdown="
						(e: PointerEvent) => {
							handleChange(e);
							// open = false;
						}
					"
				/>
				<ComboboxCancel as-child>
					<Button
						class="p-2"
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
					class="max-h-48 max-w-80 overflow-y-auto overflow-x-hidden rounded-md border border-neutral-500/30 bg-white p-1.5"
					position="popper"
					side="bottom"
				>
					<template v-for="(item, idx) in list" :key="String(item.value)">
						<ComboboxItem
							class="flex cursor-default rounded px-2 py-1 data-highlighted:bg-muted"
							:value="item.value"
							@select="handleSelect"
						>
							<span class="truncate">{{ item.displayValue }}</span>
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
					class="self-end"
					:disabled="!(value.length > 0 && queryWarnings.isValid)"
					variant="outline"
					@click="submitSearch"
					><FunnelPlus class="size-4" /></Button
			></DropdownMenuTrigger>

			<DropdownMenuContent class="w-52 max-h-[var(--radix-dropdown-menu-content-available-height)]">
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
							class="text-sm text-start font-normal w-full p-1 pl-4 h-auto whitespace-normal justify-start"
							variant="ghost"
							@click="() => addMetaFilterToQuery(key, entry.value)"
							>{{ entry.displayValue }}</Button
						>
					</CollapsibleContent>
				</Collapsible>
			</DropdownMenuContent>
		</DropdownMenu>
		<Button class="self-end" variant="outline" @click="submitSearch">Search</Button>
		<div v-if="queryWarnings.warnings.length" class="text-xs text-orange-700 mt-1 ml-1">
			<div v-for="(warning, idx) in queryWarnings.warnings" :key="idx">{{ warning }}</div>
		</div>
		<div
			v-else-if="!table.getFilteredRowModel().flatRows.length"
			class="text-xs text-on-muted mt-1 ml-1"
		>
			Your query returned no results.
		</div>
	</div>
</template>
