<script setup lang="ts">
import { Collapse, initTWE } from "tw-elements";

import type { DictQuerySchema } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof DictQuerySchema>["params"];
}>();
const { params } = toRefs(props);

defineEmits(["updateQueryParam"]);

const dictStore = useDictStore();
await dictStore.initialize();
const myDict = await dictStore.getDictById(params.value.textId);

const formId = `dictQueryForm-${params.value.textId}`;

/* data fetch parameters editing copies */
const q = ref<string | undefined>(params.value.queryParams?.q ?? "");
const page = ref<number>(params.value.queryParams?.page ?? 1);
const pageSize = ref<number | undefined>(params.value.queryParams?.pageSize);
const id = ref<string | null | undefined>(params.value.queryParams?.id);
const ids = ref<string | null | undefined>(params.value.queryParams?.ids);
const sort = ref<"asc" | "desc" | "none" | null | undefined>(params.value.queryParams?.sort);
const altLemma = ref<string | null | undefined>(params.value.queryParams?.altLemma);
const format = ref<string | null | undefined>(params.value.queryParams?.format ?? "html");

/* filter criteria editor */
const isTextInputManual = ref(false);
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

const editFilter = (k: string, v: string): void => {
	if (myDict?.queryTemplates.has(k)) {
		queryTemplate.value = k;
		textInput.value = v;
	}
};

watch(
	filterCriteria,
	() => {
		q.value = [...filterCriteria.value.entries()]
			.map(function ([key, value]) {
				return `${key}=${value}`;
			})
			.join(" & ");
	},
	{ deep: true },
);

const updateFilterCriteria = () => {
	textInput.value = "";
	filterCriteria.value =
		q.value === undefined || q.value === ""
			? new Map([])
			: new Map(
					q.value
						.trim()
						.split(" & ")
						.map((kv: string): [string, string] =>
							kv.includes("=")
								? [kv.substring(0, kv.indexOf("=")), kv.substring(kv.indexOf("=") + 1)]
								: [kv, ""],
						),
				);
};

/* data fetch initialization */
const queryParams = ref<Parameters<typeof useDictsEntries>[0]["queryParams"]>({});
const updateQueryParams = () => {
	if (queryParams.value === undefined) return;
	if (q.value) queryParams.value.q = q.value;
	else delete queryParams.value.q;
	if (isTextInputManual.value) {
		updateFilterCriteria();
	}
	if (page.value) queryParams.value.page = page.value;
	else delete queryParams.value.page;
	if (pageSize.value) queryParams.value.pageSize = pageSize.value;
	else delete queryParams.value.pageSize;
	if (id.value) queryParams.value.id = id.value;
	else delete queryParams.value.id;
	if (ids.value) queryParams.value.ids = ids.value;
	else delete queryParams.value.ids;
	if (sort.value) queryParams.value.sort = sort.value;
	else delete queryParams.value.sort;
	if (altLemma.value) queryParams.value.altLemma = altLemma.value;
	else delete queryParams.value.altLemma;
	if (format.value) queryParams.value.format = format.value;
	else delete queryParams.value.format;
};
updateQueryParams();
const { data, isPending, isPlaceholderData } = useDictsEntries({
	dictId: String(myDict?.id),
	queryParams: queryParams.value,
});
watch(data, (newData) => {
	if (!newData) return;
	page.value = parseInt(newData.page);
	pageSize.value = parseInt(newData.page_size);
});

/* window behaviour */
const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const isExtendedFormOpen = ref(false);
onMounted(() => {
	initTWE({ Collapse });
	const formElement = document.getElementById(`${formId}_ext`);
	formElement?.addEventListener("show.te.collapse", () => {
		isExtendedFormOpen.value = true;
	});
	formElement?.addEventListener("hidden.te.collapse", () => {
		isExtendedFormOpen.value = false;
	});
	new Collapse(formElement, {
		toggle: isExtendedFormOpen.value,
	});
});

/* pagination */
const goToPage = (newPage: number) => {
	page.value = newPage;
	updateQueryParams();
};

/* TODO: only for testing; not intended for production */
const api = useApiClient();
</script>

<template>
	<div
		v-if="!!myDict"
		class="relative isolate size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable vuejs-accessibility/form-control-has-label, tailwindcss/no-custom-classname -->
		<div class="prose max-w-3xl px-8 pb-4 pt-8">
			<div class="dvStats flex w-full items-baseline">Query {{ params.textId }}:</div>
			<div :id="formId" class="max-w-3xl bg-gray-200 p-4">
				<div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input v-model="isTextInputManual" class="peer sr-only" type="checkbox" />
						<div
							class="peer relative h-4 w-10 flex-auto shrink-0 rounded-[5px] bg-gray-500 after:absolute after:start-[2px] after:top-px after:m-0.5 after:h-3 after:w-4 after:rounded-[3px] after:border after:border-gray-500/50 after:bg-on-primary after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-primary/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800 rtl:peer-checked:after:-translate-x-full"
						></div>
						<span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
							Manual edit
						</span>
					</label>
				</div>
				<div v-if="isTextInputManual">
					<InputBuilder v-model="q" :button-labels="myDict.specChars" @submit="updateQueryParams" />
				</div>
				<div v-else>
					<div>
						<InputBuilder
							v-model="textInput"
							v-model:select-value="queryTemplate"
							aria-label="Search"
							:button-labels="myDict.specChars"
							class="mb-3"
							placeholder="Filter by&hellip;"
							:select-options="myDict.queryTemplates"
							submit-button-label="+"
							@submit="addFilter"
						/>
					</div>
					<div v-if="filterCriteria.size > 0" class="mt-0.5 flex flex-row flex-wrap gap-1">
						<button
							v-for="([k, v], i) in filterCriteria"
							:key="i"
							class="my-0.5 flex flex-col items-center rounded-md border-2 border-primary p-0.5 hover:bg-gray-50"
							style="overflow-wrap: anywhere"
							@click="editFilter(k, v)"
						>
							<span class="flex grow flex-row flex-nowrap">
								<span class="text-center text-xs">{{ k }}</span>
								<button
									class="ml-0.5 h-3.5 shrink-0 basis-3.5 content-center self-start rounded-full bg-on-primary/50 p-1 text-[84%] leading-[66%] text-primary hover:bg-on-primary dark:bg-gray-700 dark:text-white"
									type="button"
									@click.prevent="removeFilter(k)"
								>
									×
								</button>
							</span>
							<span class="text-center text-sm">{{ v }}</span>
						</button>
					</div>
					<div v-else class="my-2 text-xs">
						Add one or more filters by entering criteria in the form above and pressing the "+"
						button.
					</div>
				</div>
				<div class="mt-4">
					<button
						:aria-controls="`${formId}_ext`"
						aria-expanded="false"
						class="dvStats flex w-full items-baseline"
						data-te-collapse-init
						:data-te-target="`#${formId}_ext`"
						tabindex="0"
						type="button"
					>
						Extended options:
						<div class="relative top-1 ml-auto mr-4">
							<div v-if="!isExtendedFormOpen">
								<svg
									class="svg-icon"
									style="
										vertical-align: middle;
										overflow: hidden;
										width: 1em;
										height: 1em;
										fill: currentColor;
									"
									version="1.1"
									viewBox="0 0 1024 1024"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M511.5 789.9 80.6 359c-22.8-22.8-22.8-59.8 0-82.6 22.8-22.8 59.8-22.8 82.6 0l348.3 348.3 348.3-348.3c22.8-22.8 59.8-22.8 82.6 0 22.8 22.8 22.8 59.8 0 82.6L511.5 789.9 511.5 789.9zM511.5 789.9"
									/>
								</svg>
							</div>
							<div v-if="isExtendedFormOpen">
								<svg
									class="svg-icon"
									style="
										vertical-align: middle;
										overflow: hidden;
										width: 1em;
										height: 1em;
										fill: currentColor;
									"
									version="1.1"
									viewBox="0 0 1024 1024"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M511.5 259.3 942.4 690.1c22.8 22.8 22.8 59.8 0 82.6-22.8 22.8-59.8 22.8-82.6 0L511.5 424.5 163.2 772.8c-22.8 22.8-59.8 22.8-82.6 0-22.8-22.8-22.8-59.8 0-82.6L511.5 259.3 511.5 259.3zM511.5 259.3"
									/>
								</svg>
							</div>
						</div>
					</button>
					<div
						:id="`${formId}_ext`"
						class="!visible hidden max-w-3xl bg-gray-200 px-4"
						data-te-collapse-item
					>
						<table class="w-full max-w-full table-fixed">
							<tbody>
								<tr>
									<th>page</th>
									<td>
										<input v-model="page" class="w-full" type="number" />
									</td>
								</tr>
								<tr>
									<th>pageSize</th>
									<td>
										<input v-model="pageSize" class="w-full" type="number" />
									</td>
								</tr>
								<tr>
									<th>id</th>
									<td>
										<input v-model="id" class="w-full" type="text" />
									</td>
								</tr>
								<tr>
									<th>ids</th>
									<td>
										<input v-model="ids" class="w-full" type="text" />
									</td>
								</tr>
								<tr>
									<th>sort</th>
									<td>
										<select v-model="sort" class="w-full">
											<option :value="null"></option>
											<option value="none">none</option>
											<option value="asc">asc</option>
											<option value="desc">desc</option>
										</select>
									</td>
								</tr>
								<tr>
									<th>altLemma</th>
									<td>
										<input v-model="altLemma" class="w-full" type="text" />
									</td>
								</tr>
								<tr>
									<th>format</th>
									<td>
										<input v-model="format" class="w-full" type="text" />
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<div class="mt-3">
					<button
						class="biblQueryBtn"
						:disabled="!(q || id || ids) || format === ''"
						@click="updateQueryParams"
					>
						Query
					</button>
				</div>
			</div>
		</div>

		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div v-if="data" class="prose mb-auto max-w-3xl p-8">
			<div v-if="data.total_items">Total items: {{ data.total_items }}</div>
			<div v-if="data.page_count">
				<UPagination
					:model-value="parseInt(data.page)"
					:page-count="parseInt(data.page_size)"
					:total="parseInt(data.total_items)"
					@update:model-value="goToPage"
				/>
			</div>
			<div v-if="data.took">Search duration: {{ data.took }} ms</div>
			<div v-if="data._embedded && data._embedded.entries">
				<div v-for="(e, i) in data._embedded.entries" :key="i" class="mt-6">
					<div v-if="typeof e.id === 'string'" class="text-sm">
						<span class="font-bold">id:&nbsp;</span>
						<span>
							<a :href="`${api.baseUrl}${e._links?.self.href}`">{{ e.id }}</a>
						</span>
					</div>
					<div v-if="typeof e.sid === 'string'" class="text-sm">
						<span class="font-bold">sid:&nbsp;</span>
						<span>
							{{ e.sid }}
						</span>
					</div>
					<div v-if="typeof e.lemma === 'string'" class="text-sm">
						<span class="font-bold">lemma:&nbsp;</span>
						<span>
							{{ e.lemma }}
						</span>
					</div>
					<div v-if="typeof e.status === 'string'" class="text-sm">
						<span class="font-bold">status:&nbsp;</span>
						<span>
							{{ e.status }}
						</span>
					</div>
					<div v-if="typeof e.type === 'string'" class="text-sm">
						<span class="font-bold">type:&nbsp;</span>
						<span>
							{{ e.type }}
						</span>
					</div>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div v-if="typeof e.entry === 'string'" v-html="e.entry" />
				</div>
			</div>
		</div>

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
	<div v-else class="prose relative isolate size-full max-w-3xl overflow-auto px-8 pb-4 pt-8">
		Error: Dictionary "{{ params.textId }}" could not be loaded.
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern */
.dvStats {
	@apply m-0 mb-[5px] pb-[5px] pl-[5px] border border-solid border-primary bg-primary text-on-primary font-bold;
}

.spQueryText {
	@apply text-gray-200 italic;
}

.biblQueryBtn {
	@apply w-full h-10 text-primary border-2 border-solid border-primary font-bold bg-on-primary inline-block text-center whitespace-nowrap align-middle rounded disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400 hover:bg-primary hover:text-on-primary;
}

.aInternal {
	@apply no-underline text-inherit;
}

.dvDef {
	@apply pl-[5px] italic ml-0 text-base;
}

.dvExamples {
	@apply border border-black bg-on-primary text-sm px-[5px]  m-[3px];
}

.dvLangSep {
	@apply border-t-[0.5px] border-dotted border-t-sky-500 bg-on-primary;
}

.dvMWUExamples {
	@apply border border-black bg-on-primary;
}

.dvRoundLemmaBox {
	@apply text-right pt-[3px] pr-[5px] pb-0.5 relative top-[3px] left-[-15px] w-[100px] rounded-[5px] bg-gray-200 font-bold text-lg text-primary border border-primary align-baseline;

	direction: ltr;
}

.dvRoundLemmaBox_ltr {
	@apply text-left pt-[3px] pl-[5px] pb-0.5 relative top-[3px] left-[-15px] max-w-[420px] rounded-[5px] bg-gray-200 font-bold text-lg text-primary border border-primary align-baseline;

	direction: ltr;
}

.dvUsg {
	@apply italic ml-[5px] text-sm;
}

.spBibl {
	@apply italic text-sm text-left text-yellow-900;
}

.spEditors {
	@apply italic text-yellow-900 text-sm;
}

.spEtym {
	@apply italic text-gray-500 text-sm;
}

.spGramGrp {
	@apply text-green-600 italic text-sm align-baseline;
}

.spRoot {
	@apply text-sm text-yellow-600 align-baseline;
}

.spTrans {
	@apply italic border-0 text-indigo-400;

	overflow-wrap: anywhere;
}

.spTransDe,
.opWordList_de {
	@apply text-violet-500  border-0 italic;

	overflow-wrap: anywhere;
}

.spTransEn,
.opWordList_en {
	@apply border-0 italic text-indigo-400;

	overflow-wrap: anywhere;
}

.spTransFr,
.opWordList_fr {
	@apply border-0 italic text-pink-600;

	overflow-wrap: anywhere;
}

.opWordList_ar {
	@apply border-0 italic text-violet-500;

	overflow-wrap: anywhere;
}

.tbEntry {
	@apply m-0 mb-2.5 mr-2.5;
}

.tdMain {
	@apply bg-on-primary min-w-[300px] break-words;
}

.dvDictResults {
	@apply border border-black text-yellow-900 bg-on-primary mt-5;
}

.tdExpl {
	@apply border border-black bg-on-primary;
}

.tdNoBorderRTL {
	@apply border-0 pl-0 align-top break-words;

	direction: rtl;
}

.tdNoBorder {
	@apply align-top pl-0 border-0 break-words;
}

.tdHead {
	@apply text-on-primary text-right px-[5px] break-words align-top bg-primary border-b-primary/50 w-1;
}

.tdKWICMain {
	@apply border-b border-dotted border-indigo-600 pl-[5px];
}

.tdSense {
	@apply bg-on-primary;

	overflow-wrap: break-word;
}

[data-toggle="tooltip"] {
	@apply cursor-pointer;
}

/* InputBuilder stylesheet */
.ib-buttons button {
	@apply border-0 bg-primary px-[5px] text-on-primary hover:bg-opacity-50 rounded-[3px] m-0.5;
}

.ib-input-row {
	@apply flex flex-row flex-wrap w-full gap-0.5  align-baseline justify-stretch;
}

.ib-textinput {
	@apply flex-grow flex-shrink basis-20;
}

.ib-textinput input {
	@apply mt-0.5 block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500;
}

.ib-select {
	@apply flex-grow flex-shrink basis-20;
}

.ib-select select {
	@apply w-full h-full bg-gray-300 rounded;
}

.ib-submit {
	@apply flex-shrink basis-6;
}

.ib-submit button {
	@apply h-full border-2 border-gray-300 w-full px-[5px] text-gray-900 hover:bg-opacity-50 hover:bg-primary hover:text-on-primary rounded-[3px];
}
</style>
