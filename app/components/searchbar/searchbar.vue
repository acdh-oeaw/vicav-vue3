<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";
import { SquareMousePointer, TextCursorInput, X } from "lucide-vue-next";
import { computed, ref } from "vue";

import type { TriggerMap } from "./index.ts";
import MultiValueSearchbar from "./multi-value-searchbar.vue";
import TagSearchbar from "./tag-searchbar.vue";

const _props = defineProps<{
	table: Table<unknown>;
	triggers: TriggerMap;
}>();

type SearchMode = "tag" | "text";
const mode = ref<SearchMode>("tag");

const tagRef = useTemplateRef<InstanceType<typeof TagSearchbar>>("tagRef");
const multiRef = useTemplateRef<InstanceType<typeof MultiValueSearchbar>>("multiRef");
const active = computed(() => (mode.value === "tag" ? tagRef.value : multiRef.value));

const { validateQuery } = useFilterParser();
const currentValue = computed({
	get: () => String(active.value?.value ?? ""),
	set: (value: string) => {
		if (!active.value) return;
		active.value.value = value;
	},
});
const queryWarnings = computed(() => validateQuery(currentValue.value));
const hasValue = computed(() => Boolean(currentValue.value.trim()));

function submitSearch() {
	active.value?.submitSearch();
}

function clearAll() {
	active.value?.clear();
}

function toggleMode() {
	mode.value = mode.value === "tag" ? "text" : "tag";
}

defineExpose({ submitSearch, value: currentValue });
</script>

<template>
	<div class="grid w-full max-w-full grid-cols-[1fr_auto]">
		<div
			class="flex min-h-10 w-full max-w-full rounded-md rounded-r-none border border-muted bg-white"
		>
			<TagSearchbar
				v-if="mode === 'tag'"
				ref="tagRef"
				class="min-w-0 flex-1"
				:table="table"
				:triggers="triggers"
			/>
			<MultiValueSearchbar
				v-else
				ref="multiRef"
				class="min-w-0 flex-1"
				:table="table"
				:triggers="triggers"
			/>

			<div class="flex shrink-0 items-center border-l border-muted">
				<Button
					class="h-full rounded-none border-0 px-2"
					:title="mode === 'tag' ? 'Switch to text mode' : 'Switch to tag mode'"
					variant="outline"
					@click="toggleMode"
				>
					<TextCursorInput v-if="mode === 'tag'" class="size-4" />
					<SquareMousePointer v-else class="size-4" />
				</Button>
				<Button
					v-if="hasValue"
					class="h-full rounded-none border-0 border-l border-muted px-2"
					title="Clear query"
					variant="outline"
					@click="clearAll"
				>
					<X class="size-4" />
				</Button>
			</div>
		</div>

		<Button
			class="h-full self-end rounded-l-none bg-header text-white hover:bg-primary"
			variant="outline"
			@click="submitSearch"
		>
			Search
		</Button>

		<div v-if="queryWarnings.warnings.length" class="col-span-2 mt-1 ml-1 text-xs text-orange-700">
			<div v-for="(warning, idx) in queryWarnings.warnings" :key="idx">{{ warning }}</div>
		</div>
		<div
			v-else-if="hasValue && !table.getFilteredRowModel().flatRows.length"
			class="col-span-2 mt-1 ml-1 text-xs text-on-muted"
		>
			Your query returned no results.
		</div>
	</div>
</template>
