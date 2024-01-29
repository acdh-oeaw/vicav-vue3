<script setup lang="ts">
import type { DictQuerySchema } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof DictQuerySchema>["params"];
}>();
const { params } = toRefs(props);

defineEmits(["updateQueryParam"]);

const dictStore = useDictStore();
await dictStore.initialize();
const myDict = await dictStore.getDictById(params.value.textId);

const formId = `biblioQueryForm-${params.value.textId}`;

const textInput = ref("");
const queryTemplate = ref("");
const filterCriteria = ref<Map<string, string>>(new Map([]));
const addFilter = () => {
	if (textInput.value !== "") {
		filterCriteria.value.set(queryTemplate.value, textInput.value);
	}
};
const removeFilter = (key: string) => {
	filterCriteria.value.delete(key);
};
const q = computed(() =>
	[...filterCriteria.value.entries()]
		.map(function ([key, value]) {
			return `${key}=${value}`;
		})
		.join(" & "),
);

const page = ref<number | undefined>();
const pageSize = ref<number | undefined>();
const id = ref<string | null | undefined>();
const ids = ref<string | null | undefined>();
const sort = ref<"asc" | "desc" | "none" | null | undefined>();
const altLemma = ref<string | null | undefined>();
const format = ref<string | null | undefined>();

const queryParams = ref<Parameters<typeof useDictsEntries>[0]["queryParams"]>({});
const { data, isPending, isPlaceholderData } = useDictsEntries({
	dictId: String(myDict?.id),
	queryParams: queryParams.value,
});

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const submitNewQuery = () => {
	if (queryParams.value === undefined) return;
	if (page.value) queryParams.value.page = page.value;
	else delete queryParams.value.page;
	if (pageSize.value) queryParams.value.pageSize = pageSize.value;
	else delete queryParams.value.pageSize;
	if (id.value) queryParams.value.id = id.value;
	else delete queryParams.value.id;
	if (ids.value) queryParams.value.ids = ids.value;
	else delete queryParams.value.ids;
	if (q.value) queryParams.value.q = q.value;
	else delete queryParams.value.q;
	if (sort.value) queryParams.value.sort = sort.value;
	else delete queryParams.value.sort;
	if (altLemma.value) queryParams.value.altLemma = altLemma.value;
	else delete queryParams.value.altLemma;
	if (format.value) queryParams.value.format = format.value;
	else delete queryParams.value.format;
};
</script>

<template>
	<div
		v-if="!!myDict"
		class="relative isolate h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable vuejs-accessibility/form-control-has-label, tailwindcss/no-custom-classname -->
		<div class="prose max-w-3xl px-8 pb-4 pt-8">
			<div class="dvStats flex w-full items-baseline">Query {{ params.textId }}:</div>
			<div :id="formId" class="max-w-3xl bg-gray-200 p-4">
				<div>
					<InputExtended
						v-model="textInput"
						v-model:selectValue="queryTemplate"
						:button-labels="myDict.specChars"
						:select-options="myDict.queryTemplates"
						submit-button-label="+"
						placeholder="Filter by&hellip;"
						aria-label="Search"
						class="mb-3"
						@submit="addFilter"
					/>
				</div>
				<div v-if="filterCriteria.size > 0" class="mt-0.5 flex flex-row flex-wrap gap-1">
					<div
						v-for="([k, v], i) in filterCriteria"
						:key="i"
						class="my-0.5 flex flex-col items-center rounded-md border-2 border-primary p-0.5"
						style="overflow-wrap: anywhere"
					>
						<span class="flex grow flex-row flex-nowrap">
							<span class="text-center text-xs">{{ k }}</span>
							<button
								type="button"
								class="ml-0.5 h-3.5 shrink-0 basis-3.5 content-center self-start rounded-full bg-on-primary/50 p-1 text-[84%] leading-[66%] text-primary hover:bg-on-primary dark:bg-gray-700 dark:text-white"
								@click.prevent="removeFilter(k)"
							>
								×
							</button>
						</span>
						<span class="text-center text-sm">{{ v }}</span>
					</div>
				</div>
				<div v-else class="my-2 text-xs">
					Add one or more filters by entering criteria in the form above and pressing the "+"
					button.
				</div>
				<div class="mt-3">
					<button class="biblQueryBtn" :disabled="!q" @click="submitNewQuery">Query</button>
				</div>
			</div>
		</div>

		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div
			v-if="data"
			class="prose mb-auto max-w-3xl p-8"
			v-html="JSON.stringify(data._embedded.entries)"
		/>

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
	<div v-else class="prose relative isolate h-full w-full max-w-3xl overflow-auto px-8 pb-4 pt-8">
		Error: Dictionary "{{ params.textId }}" could not be loaded.
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern */
.dvStats {
	@apply mb-[5px] pb-[5px] pl-[5px] border border-solid border-primary bg-primary text-on-primary font-bold;
}

.spQueryText {
	@apply text-gray-200 italic;
}

.biblQueryBtn {
	@apply w-full h-10 text-primary border-2 border-solid border-primary font-bold bg-on-primary inline-block text-center whitespace-nowrap align-middle rounded disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400 hover:bg-primary hover:text-on-primary;
}

/* InputExtended stylesheet */
.ie-buttons button {
	@apply border-0 bg-primary px-[5px] text-on-primary hover:bg-opacity-50 rounded-[3px] m-0.5;
}

.ie-input-row {
	@apply flex flex-row flex-wrap w-full gap-0.5  align-baseline justify-stretch;
}

.ie-textinput {
	@apply flex-grow flex-shrink basis-20;
}

.ie-textinput input {
	@apply mt-0.5 block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500;
}

.ie-select {
	@apply flex-grow flex-shrink basis-20;
}

.ie-select select {
	@apply w-full h-full bg-gray-300 rounded;
}

.ie-submit {
	@apply flex-grow flex-shrink basis-4;
}

.ie-submit button {
	@apply h-full border-2 border-gray-300 w-full px-[5px] text-gray-900 hover:bg-opacity-50 hover:bg-primary hover:text-on-primary rounded-[3px];
}
</style>
