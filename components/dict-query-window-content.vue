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
const queryString = ref("");
const page = ref<number | undefined>();
const pageSize = ref<number | undefined>();
const id = ref<string | null | undefined>();
const ids = ref<string | null | undefined>();
const q = ref<string | null | undefined>();
const sort = ref<"asc" | "desc" | "none" | null | undefined>();
const altLemma = ref<string | null | undefined>();
const format = ref<string | null | undefined>();

const queryParams: Parameters<typeof useDictsEntries>["0"]["queryParams"] = {};
const { data, isPending, isPlaceholderData } = useDictsEntries({
	dictId: String(myDict?.id),
	queryParams,
});

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const submitNewQuery = () => {
	// TODO: empty queryParams?
	if (page.value) queryParams.page = page.value;
	if (pageSize.value) queryParams.pageSize = pageSize.value;
	if (id.value) queryParams.id = id.value;
	if (ids.value) queryParams.ids = ids.value;
	if (q.value) queryParams.q = q.value;
	if (sort.value) queryParams.sort = sort.value;
	if (altLemma.value) queryParams.altLemma = altLemma.value;
	if (format.value) queryParams.format = format.value;
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
			<div class="dvStats flex w-full items-baseline">
				Query {{ params.textId }}:&nbsp;&nbsp;
				<span class="spQueryText">{{ queryString }}</span>
			</div>
			<div :id="formId" class="max-w-3xl bg-gray-200 p-4">
				<div>
					<InputExtended
						v-model="queryString"
						:string-snippets="myDict.specChars"
						placeholder="Search in dictionary&hellip;"
						aria-label="Search"
						@submit="submitNewQuery"
					/>
				</div>
				<div class="mt-3">
					<button class="biblQueryBtn" :disabled="!queryString" @click="submitNewQuery">
						Query
					</button>
				</div>
			</div>
		</div>

		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div
			v-if="queryString && data"
			class="prose mb-auto max-w-3xl p-8"
			v-html="JSON.stringify(data)"
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
.ie button {
	@apply border-0 bg-primary px-[5px] text-on-primary hover:bg-opacity-50 rounded-[3px] m-0.5;
}

.ie input {
	@apply mt-0.5 block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500;
}
</style>
