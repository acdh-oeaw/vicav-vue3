<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";
import { computedWithControl } from "@vueuse/core";
import {
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
import { computed, ref, watch, watchEffect } from "vue";

const props = defineProps<{
	table: Table<unknown>;
}>();

const {
	getList,
	getValue,
	getAnchorRect,
	getSearchValue,
	getTrigger,
	getTriggerOffset,
	replaceValue,
} = useSearchbarAutocomplete();

const { parseSearchString } = useFilterParser();

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
					const { x, y, height } = getAnchorRect(textareaRef.value?.$el);
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

	const _list = getList(trigger.value);
	return _list.filter((item) => contains(String(item), searchValue.value));
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

function handleChange(ev: InputEvent) {
	const target = ev.target as HTMLTextAreaElement;
	const _trigger = getTrigger(target);
	const _searchValue = getSearchValue(target);
	if (_trigger) {
		trigger.value = _trigger;
		open.value = true;
	} else if (!_searchValue) {
		trigger.value = null;
		open.value = false;
	}

	value.value = target.value;
	searchValue.value = _searchValue;

	if (!_trigger) open.value = false;
}

function handleSelect(ev: CustomEvent) {
	const textarea = textareaRef.value?.$el;
	if (!textarea) return;

	const offset = getTriggerOffset(textarea);
	const displayValue = getValue(ev.detail.value, trigger.value);
	if (!displayValue) return;

	// prevent setting `ComboboxInput`
	ev.preventDefault();

	value.value = replaceValue(
		value.value,
		offset,
		searchValue.value,
		displayValue,
		trigger.value ?? "",
	);

	trigger.value = null;
	const nextCaretOffset = offset + displayValue.length;
	caretOffset.value = nextCaretOffset;

	nextTick().then(() => {
		handleChange({ target: textarea } as InputEvent);
	});
}

function submitSearch() {
	parseSearchString(value.value, props.table);
	props.table.setGlobalFilter(value.value);
}
</script>

<template>
	<div class="grid w-full grid-cols-[1fr_auto] gap-2">
		<ComboboxRoot
			v-model:open="open"
			class="flex w-full flex-col"
			ignore-filter
			:reset-search-term-on-blur="false"
		>
			<Label class="sr-only text-sm font-semibold" for="search"> search </Label>

			<ComboboxInput
				id="search"
				ref="textareaRef"
				v-model="value"
				as="input"
				autocomplete="off"
				class="w-full rounded-md border border-muted p-2"
				placeholder="Type : to get a list of available features"
				rows="5"
				@input="handleChange"
				@keydown.enter="
					(ev: KeyboardEvent) => {
						if (open) ev.preventDefault();
					}
				"
				@keydown.left.right="open = false"
				@pointerdown="open = false"
			/>
			<ComboboxAnchor :reference="reference" />

			<ComboboxPortal>
				<ComboboxContent
					v-if="list?.length"
					align="start"
					class="max-h-48 max-w-80 overflow-y-auto overflow-x-hidden rounded-md border border-neutral-500/30 bg-white p-1.5"
					position="popper"
					side="bottom"
				>
					<ComboboxItem
						v-for="item in list"
						:key="String(item)"
						class="flex cursor-default rounded px-2 py-1 data-[highlighted]:bg-muted"
						:value="item"
						@select="handleSelect"
					>
						<span class="truncate">{{ item }}</span>
					</ComboboxItem>
				</ComboboxContent>
			</ComboboxPortal> </ComboboxRoot
		><Button class="self-end" variant="outline" @click="submitSearch">Search</Button>
	</div>
</template>
