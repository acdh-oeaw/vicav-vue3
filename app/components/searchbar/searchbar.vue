<script setup lang="ts">
import { SquareMousePointer, TextCursorInput, X } from "@lucide/vue";
import type { Table } from "@tanstack/vue-table";
import { computed, nextTick, ref, watch } from "vue";

import type { SpecialCharacters } from "@/lib/api-client";

import type { TriggerMap } from "./index.ts";
import MultiValueSearchbar from "./multi-value-searchbar.vue";
import TagSearchbar from "./tag-searchbar.vue";

const _props = defineProps<{
	table?: Table<unknown>;
	triggers: TriggerMap;
	operators?: ReadonlyArray<string>;
	/**
	 * The trigger string for the first selection step.
	 * Defaults to "" (lucene). Set to "[" for CQL mode.
	 */
	featureTrigger?: string;
	queryMode?: "lucene" | "cql";
	onSubmit?: (value: string) => void;
	/** CQL mode: attribute key used when wrapping free-text input (e.g. "word"). */
	freeTriggerKey?: string;
	specialCharacters?: SpecialCharacters;
	dynamicKeys?: ReadonlyArray<string>;
}>();

const model = defineModel<string>({ default: "" });
const searchTerm = defineModel<string>("searchTerm", { default: "" });

// Resolve bare keys to the trigger keys the subcomponents match against:
// CQL values live under "[key=", lucene values under "key:".
const isCql = computed(() => (_props.featureTrigger ?? "") === "[" || _props.queryMode === "cql");
const dynamicTriggers = computed(() =>
	(_props.dynamicKeys ?? []).map((key) => (isCql.value ? `[${key}=` : `${key}:`)),
);

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

let syncing = false;
watch(currentValue, (value) => {
	if (!syncing) model.value = value;
});

watch(model, (value) => {
	if (!syncing && value !== currentValue.value) currentValue.value = value;
});
onMounted(() => {
	if (model.value && model.value !== currentValue.value) currentValue.value = model.value;
});
const queryWarnings = computed(() => {
	if (_props.onSubmit) return { isValid: true, warnings: [] as Array<string> };
	return validateQuery(currentValue.value);
});
const hasValue = computed(() => Boolean(currentValue.value.trim()));

function submitSearch() {
	active.value?.submitSearch();
}

function clearAll() {
	active.value?.clear();
}

function insertSnippet(snippet: string) {
	void active.value?.insertSnippet(snippet);
}

async function toggleMode() {
	syncing = true;
	const saved = currentValue.value;
	model.value = saved;
	mode.value = mode.value === "tag" ? "text" : "tag";
	await nextTick();
	if (active.value) active.value.value = saved;
	syncing = false;
}

defineExpose({ submitSearch, value: currentValue });
</script>

<template>
	<div class="grid w-full max-w-full grid-cols-[1fr_auto]">
		<div v-if="specialCharacters?.length" class="col-span-2 mb-4 flex flex-wrap gap-px">
			<!-- eslint-disable vue/no-v-html -->
			<button
				v-for="(c, i) in specialCharacters"
				:key="i"
				class="rounded-sm border border-gray-300 bg-gray-200 px-2 py-px text-sm font-bold text-gray-800 hover:bg-gray-300"
				type="button"
				@click.prevent.stop="insertSnippet(c.value)"
				v-html="c.text ?? c.value"
			></button>
		</div>
		<div
			class="flex min-h-10 w-full max-w-full rounded-md rounded-r-none border border-muted bg-white"
		>
			<TagSearchbar
				v-if="mode === 'tag'"
				ref="tagRef"
				class="min-w-0 flex-1"
				:dynamic-triggers="dynamicTriggers"
				:feature-trigger="featureTrigger"
				:free-trigger-key="freeTriggerKey"
				:on-submit="onSubmit"
				:operators="operators"
				:table="table"
				:triggers="triggers"
				@update:search-term="searchTerm = $event"
			/>
			<MultiValueSearchbar
				v-else
				ref="multiRef"
				class="min-w-0 flex-1"
				:dynamic-triggers="dynamicTriggers"
				:on-submit="onSubmit"
				:query-mode="queryMode"
				:table="table"
				:triggers="triggers"
				@update:search-term="searchTerm = $event"
			/>

			<div class="flex shrink-0 items-center border-l border-muted">
				<Button
					class="h-full rounded-none border-0 px-2"
					:title="mode === 'tag' ? 'Switch to text mode' : 'Switch to tag mode'"
					variant="outline"
					@click.prevent.stop="toggleMode"
				>
					<TextCursorInput v-if="mode === 'tag'" class="size-4" />
					<SquareMousePointer v-else class="size-4" />
				</Button>
				<Button
					v-if="hasValue"
					class="h-full rounded-none border-0 border-l border-muted px-2"
					title="Clear query"
					variant="outline"
					@click.prevent.stop="clearAll"
				>
					<X class="size-4" />
				</Button>
			</div>
		</div>

		<Button
			class="h-full self-end rounded-l-none bg-header text-white hover:bg-primary"
			variant="outline"
			@click.prevent.stop="submitSearch"
		>
			Search
		</Button>

		<div v-if="queryWarnings.warnings.length" class="col-span-2 mt-1 ml-1 text-xs text-orange-700">
			<div v-for="(warning, idx) in queryWarnings.warnings" :key="idx">{{ warning }}</div>
		</div>
		<div
			v-else-if="hasValue && table && !table.getFilteredRowModel().flatRows.length"
			class="col-span-2 mt-1 ml-1 text-xs text-on-muted"
		>
			Your query returned no results.
		</div>
	</div>
</template>
