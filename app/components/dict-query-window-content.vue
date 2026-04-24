<script setup lang="ts">
import { BookA, Braces, Code, MessageSquareQuote } from "lucide-vue-next";
import type Zod from "zod";

import type { DictQuerySchema } from "@/types/global.ts";
import { formatLocation, normalizeEntry } from "@/utils/dict-entry-rendering";

const props = defineProps<{
	params: Zod.infer<typeof DictQuerySchema>["params"];
}>();
const { params } = toRefs(props);

const emit = defineEmits(["updateQueryParam"]);
const env = useRuntimeConfig();

const dictStore = useDictStore();
await dictStore.initialize();
const myDict = await dictStore.getDictById(params.value.textId);

const debug = ref<boolean>(false);

const formId = `dictQueryForm-${params.value.textId}`;

/* data fetch parameters editing copies */
const q = ref<string>(params.value.queryParams?.q ?? "");
const page = ref<number>(params.value.queryParams?.page ?? 1);
const pageSize = ref<number | undefined | null>(params.value.queryParams?.pageSize);
const id = ref<string | null | undefined>(params.value.queryParams?.id);
const ids = ref<string | null | undefined>(params.value.queryParams?.ids);
const sort = ref<"asc" | "desc" | "none" | null | undefined>(params.value.queryParams?.sort);
const altLemma = ref<string | null | undefined>(params.value.queryParams?.altLemma);
const format = ref<string | null | undefined>("json");

/* filter criteria editor */
const filterCriteria = ref<Map<string, string>>(new Map([]));

const addFilter = () => {
	if (
		params.value.queryTemplateTextInput !== undefined &&
		params.value.queryTemplateTextInput !== ""
	) {
		filterCriteria.value.set(params.value.queryTemplate ?? "", params.value.queryTemplateTextInput);
	}
};

const removeFilter = (key: string) => {
	filterCriteria.value.delete(key);
};

const editFilter = (k: string, v: string): void => {
	if (myDict?.queryTemplates.has(k)) {
		params.value.queryTemplate = k;
		params.value.queryTemplateTextInput = v;
	}
};

watch(
	filterCriteria,
	() => {
		q.value = [...filterCriteria.value.entries()]
			.map(([key, value]) => {
				return `${key}=${value}`;
			})
			.join(" & ");
	},
	{ deep: true },
);

const updateFilterCriteria = () => {
	params.value.queryTemplateTextInput = "";
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
const setQueryParam = <K extends keyof NonNullable<typeof queryParams.value>>(
	queryParamsValue: NonNullable<typeof queryParams.value>,
	key: K,
	value: NonNullable<typeof queryParams.value>[K],
) => {
	if (value) {
		queryParamsValue[key] = value;
	} else {
		Reflect.deleteProperty(queryParamsValue, key);
	}
};

const updateQueryParams = () => {
	const queryParamsValue = queryParams.value;
	if (queryParamsValue === undefined) return;
	setQueryParam(queryParamsValue, "q", q.value);
	if (params.value.isTextInputManual) {
		updateFilterCriteria();
	} else {
		params.value.queryTemplateTextInput ??= "";
	}
	setQueryParam(queryParamsValue, "page", page.value);
	setQueryParam(queryParamsValue, "pageSize", pageSize.value);
	setQueryParam(queryParamsValue, "id", id.value);
	setQueryParam(queryParamsValue, "ids", ids.value);
	setQueryParam(queryParamsValue, "sort", sort.value);
	setQueryParam(queryParamsValue, "altLemma", altLemma.value);
	setQueryParam(queryParamsValue, "format", format.value);
	params.value.queryParams = queryParamsValue;
	// There is a label passed from the TEI description text. Can we use it?
	params.value.queryString = `${params.value.textId ?? ""}: ${queryParamsValue.q ?? ""}`;
	emit("updateQueryParam", params.value.queryString);
};
updateQueryParams();
watch(params, updateQueryParams, { deep: true });
const { data, isPending, isPlaceholderData } = useDictsEntries({
	dictId: String(myDict?.id),
	queryParams: queryParams.value,
});
watch(data, (newData) => {
	if (!newData) return;
	page.value = parseInt(newData.page);
	pageSize.value = parseInt(newData.page_size);
});

const pageCount = computed(() => {
	const count = data.value?.page_count;
	if (count == null) return undefined;

	const parsed = parseInt(count);
	return Number.isNaN(parsed) ? undefined : parsed;
});

const totalItems = computed(() => {
	const total = data.value?.total_items;
	if (total == null) return undefined;

	const parsed = parseInt(total);
	return Number.isNaN(parsed) ? undefined : parsed;
});

const canGoToPreviousPage = computed(() => page.value > 1);
const canGoToNextPage = computed(() => {
	if (pageCount.value == null) return false;
	return page.value < pageCount.value;
});
const showPagination = computed(() => {
	return (pageCount.value ?? 0) > 1;
});

const goToPreviousPage = () => {
	if (!canGoToPreviousPage.value) return;
	page.value -= 1;
	updateQueryParams();
};

const goToNextPage = () => {
	if (!canGoToNextPage.value) return;
	page.value += 1;
	updateQueryParams();
};

const renderedEntries = computed(() => {
	return data.value?._embedded?.entries.map((entry) => normalizeEntry(entry)) ?? [];
});

const getEntryLink = (entryId: string | number | null | undefined, responseFormat?: "json") => {
	if (entryId == null || myDict?.id == null) return undefined;

	const path = `/restvle/dicts/${myDict.id}/entries`;
	const url = env.public.apiBaseUrl
		? new URL(path, env.public.apiBaseUrl)
		: new URL(path, "http://localhost");
	url.searchParams.set("id", String(entryId));

	if (responseFormat != null) {
		url.searchParams.set("format", responseFormat);
	}

	return env.public.apiBaseUrl ? url.toString() : `${path}${url.search}`;
};

/* window behaviour */
const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const isExtendedFormOpen = ref(false);

/* TODO: only for testing; not intended for production
const api = useApiClient(); */
</script>

<template>
	<div
		v-if="!!myDict"
		class="relative isolate size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable vuejs-accessibility/form-control-has-label, tailwindcss/no-custom-classname -->
		<Collapsible v-model:open="params.isQueryVisible" class="prose max-w-6xl px-8 pt-8 pb-4">
			<CollapsibleTrigger
				class="flex w-full items-baseline bg-primary p-4 pt-0 pb-0 text-on-primary"
			>
				<span>Query {{ params.textId }}:</span>
				<div class="relative top-1 mr-4 ml-auto">
					<div v-if="!params.isQueryVisible">
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
					<div v-if="params.isQueryVisible">
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
			</CollapsibleTrigger>
			<CollapsibleContent :id="formId" class="max-w-6xl bg-gray-200 p-4">
				<div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input v-model="params.isTextInputManual" class="peer sr-only" type="checkbox" />
						<div
							class="peer relative h-4 w-10 flex-auto shrink-0 rounded-[5px] bg-gray-500 peer-checked:bg-primary peer-focus:ring-4 peer-focus:ring-primary/50 peer-focus:outline-hidden after:absolute after:inset-s-0.5 after:top-px after:m-0.5 after:h-3 after:w-4 after:rounded-[3px] after:border after:border-gray-500/50 after:bg-on-primary after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-primary/50 peer-checked:rtl:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"
						></div>
						<span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
							Manual edit
						</span>
					</label>
				</div>
				<div v-if="params.isTextInputManual">
					<InputBuilder
						v-model="q"
						:special-characters="myDict.specialCharacters"
						@submit="updateQueryParams"
					/>
				</div>
				<div v-else>
					<div>
						<InputBuilder
							v-model="params.queryTemplateTextInput"
							v-model:select-value="params.queryTemplate"
							aria-label="Search"
							class="mb-3"
							placeholder="Filter by&hellip;"
							:select-options="myDict.queryTemplates"
							:special-characters="myDict.specialCharacters"
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
					<Collapsible v-model:open="isExtendedFormOpen" class="prose max-w-6xl px-8 pt-8 pb-4">
						<CollapsibleTrigger class="dvStats flex w-full items-baseline">
							Extended options:s
							<div class="relative top-1 mr-4 ml-auto">
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
										viewBox="0 0 1024 1024"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M511.5 259.3 942.4 690.1c22.8 22.8 22.8 59.8 0 82.6-22.8 22.8-59.8 22.8-82.6 0L511.5 424.5 163.2 772.8c-22.8 22.8-59.8 22.8-82.6 0-22.8-22.8-22.8-59.8 0-82.6L511.5 259.3 511.5 259.3zM511.5 259.3"
										/>
									</svg>
								</div>
							</div>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div :id="`${formId}_ext`" class="bg-gray-200 px-4">
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
						</CollapsibleContent>
					</Collapsible>
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
			</CollapsibleContent>
		</Collapsible>

		<div
			v-if="data && showPagination"
			class="mx-8 mb-2 flex max-w-6xl flex-wrap items-end gap-3 border-y border-border/60 py-3"
		>
			<label class="flex flex-col gap-1 text-sm font-medium">
				<span>Page</span>
				<input
					v-model.number="page"
					class="h-9 w-24 rounded-sm border border-input bg-background px-2 text-sm"
					:max="pageCount"
					min="1"
					type="number"
					@change="updateQueryParams"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium">
				<span>Page size</span>
				<input
					v-model.number="pageSize"
					class="h-9 w-28 rounded-sm border border-input bg-background px-2 text-sm"
					min="1"
					type="number"
					@change="updateQueryParams"
				/>
			</label>
			<div class="flex items-center gap-2">
				<button
					class="h-9 rounded-sm border border-primary px-3 text-sm font-semibold text-primary disabled:border-gray-300 disabled:text-gray-400"
					:disabled="!canGoToPreviousPage"
					type="button"
					@click="goToPreviousPage"
				>
					Previous
				</button>
				<button
					class="h-9 rounded-sm border border-primary px-3 text-sm font-semibold text-primary disabled:border-gray-300 disabled:text-gray-400"
					:disabled="!canGoToNextPage"
					type="button"
					@click="goToNextPage"
				>
					Next
				</button>
			</div>
			<div class="text-muted-foreground text-sm">
				<span>Page {{ page }}</span>
				<span v-if="pageCount"> of {{ pageCount }}</span>
				<span v-if="totalItems != null">, {{ totalItems }} items</span>
			</div>
		</div>

		<div v-if="data" class="prose mb-auto max-w-6xl p-8">
			<Toggle v-model="debug">
				<div v-if="data.total_items">Total items: {{ data.total_items }}</div>
				<div v-if="data.took">Search duration: {{ data.took }} ms</div>
			</Toggle>
			<div v-if="debug && data.page_count">
				<pre>{{ JSON.stringify(data._links, null, "  ") }}</pre>
			</div>
			<div v-if="renderedEntries.length > 0" class="space-y-4">
				<div v-for="(e, i) in renderedEntries" :key="e.id ?? i">
					<div v-if="debug" class="text-sm">
						<pre>{{ JSON.stringify(e.raw, null, "  ") }}</pre>
					</div>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div v-if="e.html" v-html="e.html" />
					<Card v-else class="overflow-hidden rounded-sm border-2 border-primary/40 shadow-sm">
						<CardHeader class="gap-3 border-b border-primary bg-primary text-on-primary">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<div class="flex items-start gap-3">
										<TooltipProvider
											v-if="e.type === 'entry' || e.type === 'example'"
											:delay-duration="0"
										>
											<Tooltip>
												<TooltipTrigger as-child>
													<button
														:aria-label="e.type"
														class="flex size-10 shrink-0 items-center justify-center rounded-sm border border-on-primary/40 bg-on-primary text-primary shadow-sm"
														type="button"
													>
														<BookA v-if="e.type === 'entry'" class="size-5" />
														<MessageSquareQuote v-else class="size-5" />
													</button>
												</TooltipTrigger>
												<TooltipContent class="border-black bg-black text-white" side="bottom">
													{{ e.type }}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<div class="min-w-0 space-y-1">
											<CardTitle class="text-lg leading-snug text-on-primary">
												{{ e.title }}
											</CardTitle>
											<CardDescription
												v-if="e.location"
												class="text-sm font-semibold tracking-[0.08em] text-on-primary/80 uppercase"
											>
												{{ e.location }}
											</CardDescription>
										</div>
									</div>
								</div>
								<div class="ml-4 flex shrink-0 flex-col items-end gap-2 self-start">
									<div class="flex items-center justify-end gap-2">
										<TooltipProvider :delay-duration="0">
											<Tooltip>
												<TooltipTrigger as-child>
													<NuxtLink
														aria-label="entry as xml"
														class="flex size-8 items-center justify-center rounded-sm border border-on-primary/40 text-on-primary hover:bg-on-primary hover:text-primary"
														external
														rel="noopener noreferrer"
														target="_blank"
														:to="getEntryLink(e.id)"
													>
														<Code class="size-4" />
													</NuxtLink>
												</TooltipTrigger>
												<TooltipContent class="border-black bg-black text-white" side="bottom">
													view as xml
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider :delay-duration="0">
											<Tooltip>
												<TooltipTrigger as-child>
													<NuxtLink
														aria-label="entry as JSON"
														class="flex size-8 items-center justify-center rounded-sm border border-on-primary/40 text-on-primary hover:bg-on-primary hover:text-primary"
														external
														rel="noopener noreferrer"
														target="_blank"
														:to="getEntryLink(e.id, 'json')"
													>
														<Braces class="size-4" />
													</NuxtLink>
												</TooltipTrigger>
												<TooltipContent class="border-black bg-black text-white" side="bottom">
													view as JSON
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
									<div class="flex flex-wrap justify-end gap-2">
										<Badge v-if="e.id" variant="outline">id: {{ e.id }}</Badge>
										<Badge v-if="e.status && e.status !== 'released'" variant="outline">
											{{ e.status }}
										</Badge>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent class="pt-4">
							<Table>
								<TableBody>
									<TableRow v-if="e.metadata.length > 0">
										<TableCell class="w-32 font-semibold">Metadata</TableCell>
										<TableCell>
											<div class="flex flex-wrap items-center gap-2">
												<Badge
													v-for="item in e.metadata"
													:key="`${item.label}-${item.value}`"
													variant="outline"
												>
													{{ item.label }}: {{ item.value }}
												</Badge>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.lemmaForms.length > 0 || e.variantForms.length > 0">
										<TableCell class="w-32 font-semibold">Forms</TableCell>
										<TableCell>
											<div class="space-y-3">
												<div
													v-for="(form, formIndex) in e.lemmaForms"
													:key="`lemma-${formIndex}`"
													class="space-y-2"
												>
													<div class="flex flex-wrap items-center gap-2">
														<Badge
															v-for="item in form.metadata"
															:key="`lemma-${formIndex}-${item.label}-${item.value}`"
															variant="outline"
														>
															{{ item.label }}: {{ item.value }}
														</Badge>
													</div>
													<div class="flex flex-wrap items-center gap-2">
														<span
															v-for="orthography in form.orthographies"
															:key="`lemma-${formIndex}-${orthography.lang}-${orthography.text}`"
															class="inline-flex items-center gap-2"
															:class="{ 'text-muted-foreground': orthography.isMissing }"
														>
															<Badge v-if="orthography.lang" variant="outline">
																{{ orthography.lang }}
															</Badge>
															<span>{{ orthography.text }}</span>
														</span>
													</div>
												</div>
												<div
													v-for="(form, formIndex) in e.variantForms"
													:key="`variant-${formIndex}`"
													class="space-y-2 border-t border-border/60 pt-3"
												>
													<div class="flex flex-wrap items-center gap-2">
														<span class="text-sm font-semibold">Variant</span>
														<Badge
															v-for="item in form.metadata"
															:key="`variant-${formIndex}-${item.label}-${item.value}`"
															variant="outline"
														>
															{{ item.label }}: {{ item.value }}
														</Badge>
													</div>
													<div class="flex flex-wrap items-center gap-2">
														<span
															v-for="orthography in form.orthographies"
															:key="`variant-${formIndex}-${orthography.lang}-${orthography.text}`"
															class="inline-flex items-center gap-2"
															:class="{ 'text-muted-foreground': orthography.isMissing }"
														>
															<Badge v-if="orthography.lang" variant="outline">
																{{ orthography.lang }}
															</Badge>
															<span>{{ orthography.text }}</span>
														</span>
													</div>
													<div v-if="form.grammar.length > 0" class="space-y-1.5">
														<div
															v-for="item in form.grammar"
															:key="`variant-${formIndex}-${item.label}`"
															class="flex items-start gap-4"
														>
															<div class="w-36 shrink-0 text-sm font-semibold tracking-[0.02em]">
																{{ item.label }}
															</div>
															<div class="min-w-0 flex-1 text-sm font-normal">
																{{ item.value }}
															</div>
														</div>
													</div>
												</div>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.locations.length > 0">
										<TableCell class="w-32 font-semibold">Locations</TableCell>
										<TableCell>
											<div class="flex flex-wrap gap-2">
												<Badge
													v-for="location in e.locations"
													:key="formatLocation(location)"
													variant="outline"
												>
													{{ formatLocation(location) }}
												</Badge>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.grammar.length > 0">
										<TableCell class="w-32 font-semibold">Grammar</TableCell>
										<TableCell>
											<div class="space-y-1.5">
												<div
													v-for="item in e.grammar"
													:key="item.label"
													class="flex items-start gap-4"
												>
													<div class="w-36 shrink-0 text-sm font-semibold tracking-[0.02em]">
														{{ item.label }}
													</div>
													<div class="min-w-0 flex-1 text-sm font-normal">
														{{ item.value }}
													</div>
												</div>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.quote">
										<TableCell class="w-32 font-semibold">Quote</TableCell>
										<TableCell>
											<div class="space-y-2">
												<p class="m-0">{{ e.quote.text }}</p>
												<Badge v-if="e.quote.lang" variant="outline">{{ e.quote.lang }}</Badge>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.translations.length > 0">
										<TableCell class="w-32 font-semibold">Translations</TableCell>
										<TableCell>
											<div class="space-y-2">
												<div
													v-for="translation in e.translations"
													:key="`${translation.lang}-${translation.text}`"
													class="flex flex-wrap items-center gap-2"
												>
													<Badge v-if="translation.lang" variant="outline">
														{{ translation.lang }}
													</Badge>
													<span>{{ translation.text }}</span>
												</div>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.inflectedForms.length > 0">
										<TableCell class="w-32 font-semibold">Inflected Forms</TableCell>
										<TableCell>
											<div class="space-y-3">
												<Card
													v-for="(inflected, inflectedIndex) in e.inflectedForms"
													:key="`inflected-${inflectedIndex}`"
													class="rounded-sm border border-primary/30 shadow-none"
												>
													<CardContent class="space-y-2 pt-4">
														<div class="flex flex-wrap items-center gap-2">
															<Badge
																v-for="item in inflected.metadata"
																:key="`inflected-${inflectedIndex}-${item.label}-${item.value}`"
																variant="outline"
															>
																{{ item.label }}: {{ item.value }}
															</Badge>
														</div>
														<div class="flex flex-wrap items-center gap-2">
															<span
																v-for="orthography in inflected.orthographies"
																:key="`inflected-${inflectedIndex}-${orthography.lang}-${orthography.text}`"
																class="inline-flex items-center gap-2 font-medium"
																:class="{ 'text-muted-foreground': orthography.isMissing }"
															>
																<Badge v-if="orthography.lang" variant="outline">
																	{{ orthography.lang }}
																</Badge>
																<span>{{ orthography.text }}</span>
															</span>
														</div>
														<div v-if="inflected.grammar.length > 0" class="space-y-1.5">
															<div
																v-for="item in inflected.grammar"
																:key="`inflected-${inflectedIndex}-${item.label}`"
																class="flex items-start gap-4"
															>
																<div class="w-36 shrink-0 text-sm font-semibold tracking-[0.02em]">
																	{{ item.label }}
																</div>
																<div class="min-w-0 flex-1 text-sm font-normal">
																	{{ item.value }}
																</div>
															</div>
														</div>
														<div v-if="inflected.locations.length > 0" class="flex flex-wrap gap-2">
															<Badge
																v-for="location in inflected.locations"
																:key="formatLocation(location)"
																variant="outline"
															>
																{{ formatLocation(location) }}
															</Badge>
														</div>
													</CardContent>
												</Card>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.senses.length > 0">
										<TableCell class="w-32 font-semibold">Senses</TableCell>
										<TableCell>
											<div class="space-y-4">
												<Card
													v-for="sense in e.senses"
													:key="sense.id ?? sense.translations.map((item) => item.text).join('|')"
													class="rounded-sm border border-primary/30 shadow-none"
												>
													<CardContent class="space-y-3 pt-4">
														<div class="flex flex-wrap items-center gap-2">
															<span class="font-medium">{{ sense.id ?? "Sense" }}</span>
															<Badge v-if="sense.ana" variant="outline">{{ sense.ana }}</Badge>
															<Badge
																v-for="item in sense.metadata"
																:key="`${sense.id}-${item.label}-${item.value}`"
																variant="outline"
															>
																{{ item.label }}: {{ item.value }}
															</Badge>
														</div>
														<div v-if="sense.definitions.length > 0" class="space-y-2">
															<p class="text-sm font-semibold">Definitions</p>
															<div
																v-for="definition in sense.definitions"
																:key="`${sense.id}-${definition.lang}-${definition.text}`"
																class="flex flex-wrap items-center gap-2"
																:class="{ 'text-muted-foreground': definition.isMissing }"
															>
																<Badge v-if="definition.lang" variant="outline">
																	{{ definition.lang }}
																</Badge>
																<span>{{ definition.text }}</span>
															</div>
														</div>
														<div v-if="sense.translations.length > 0" class="space-y-2">
															<div
																v-for="translation in sense.translations"
																:key="`${sense.id}-${translation.lang}-${translation.text}`"
																class="flex flex-wrap items-center gap-2"
																:class="{ 'text-muted-foreground': translation.isMissing }"
															>
																<Badge v-if="translation.lang" variant="outline">
																	{{ translation.lang }}
																</Badge>
																<span>{{ translation.text }}</span>
															</div>
														</div>
														<div v-if="sense.grammar.length > 0" class="space-y-1.5">
															<div
																v-for="item in sense.grammar"
																:key="`${sense.id}-${item.label}`"
																class="flex items-start gap-4"
															>
																<div class="w-36 shrink-0 text-sm font-semibold tracking-[0.02em]">
																	{{ item.label }}
																</div>
																<div class="min-w-0 flex-1 text-sm font-normal">
																	{{ item.value }}
																</div>
															</div>
														</div>
														<div v-if="sense.examples.length > 0" class="space-y-3">
															<p class="text-sm font-semibold">Examples</p>
															<Card
																v-for="example in sense.examples"
																:key="`${example.kind}-${example.id ?? example.quote?.text}`"
																class="rounded-sm border border-primary/25 bg-muted/20 shadow-none"
															>
																<CardContent class="space-y-2 pt-4">
																	<div class="flex flex-wrap items-center gap-2">
																		<Badge variant="outline">{{ example.kind }}</Badge>
																		<Badge
																			v-for="item in example.metadata"
																			:key="`${example.id}-${item.label}-${item.value}`"
																			variant="outline"
																		>
																			{{ item.label }}: {{ item.value }}
																		</Badge>
																	</div>
																	<div v-if="example.quote" class="grid grid-cols-[3rem_1fr] gap-2">
																		<div>
																			<Badge v-if="example.quote.lang" variant="outline">
																				{{ example.quote.lang }}
																			</Badge>
																		</div>
																		<span>{{ example.quote.text }}</span>
																	</div>
																	<div
																		v-if="example.locations.length > 0"
																		class="flex flex-wrap gap-2"
																	>
																		<Badge
																			v-for="location in example.locations"
																			:key="formatLocation(location)"
																			variant="outline"
																		>
																			{{ formatLocation(location) }}
																		</Badge>
																	</div>
																	<div v-if="example.translations.length > 0" class="space-y-1">
																		<div
																			v-for="translation in example.translations"
																			:key="`${example.id}-${translation.lang}-${translation.text}`"
																			class="grid grid-cols-[3rem_1fr] gap-2"
																			:class="{ 'text-muted-foreground': translation.isMissing }"
																		>
																			<div>
																				<Badge v-if="translation.lang" variant="outline">
																					{{ translation.lang }}
																				</Badge>
																			</div>
																			<span>{{ translation.text }}</span>
																		</div>
																	</div>
																	<div v-if="example.bibliography.length > 0" class="space-y-1">
																		<p class="text-sm font-semibold">Bibliography</p>
																		<div class="flex flex-wrap gap-2">
																			<Badge
																				v-for="item in example.bibliography"
																				:key="item"
																				variant="outline"
																			>
																				{{ item }}
																			</Badge>
																		</div>
																	</div>
																	<div v-if="example.editors.length > 0" class="space-y-1">
																		<div
																			v-for="(editor, exampleEditorIndex) in example.editors"
																			:key="`${example.id}-${editor.action}-${editor.when}-${exampleEditorIndex}`"
																			class="flex flex-wrap items-center gap-2 text-sm"
																		>
																			<span>{{ editor.who ?? "Unknown" }}</span>
																			<span>({{ editor.action }})</span>
																			<span v-if="editor.when">{{ editor.when }}</span>
																		</div>
																	</div>
																</CardContent>
															</Card>
														</div>
													</CardContent>
												</Card>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.notes.length > 0">
										<TableCell class="w-32 font-semibold">Notes</TableCell>
										<TableCell>
											<div class="space-y-2">
												<p v-for="note in e.notes" :key="note" class="m-0">
													{{ note }}
												</p>
											</div>
										</TableCell>
									</TableRow>
									<TableRow v-if="e.editors.length > 0">
										<TableCell class="w-32 font-semibold">Editors</TableCell>
										<TableCell>
											<div class="space-y-2">
												<div
													v-for="(editor, editorIndex) in e.editors"
													:key="`${editor.action}-${editor.when}-${editor.who}-${editorIndex}`"
													class="flex flex-wrap items-center gap-2"
												>
													<span class="font-medium">{{ editor.who ?? "Unknown" }}</span>
													<span>({{ editor.action }})</span>
													<span v-if="editor.when">{{ editor.when }}</span>
													<Badge v-if="editor.status" variant="outline">
														{{ editor.status }}
													</Badge>
												</div>
											</div>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
	<div v-else class="relative isolate prose size-full max-w-6xl overflow-auto px-8 pt-8 pb-4">
		Error: Dictionary "{{ params.textId }}" could not be loaded.
	</div>
</template>

<style>
@reference "@/styles/index.css";
/* stylelint-disable selector-class-pattern */
.dvStats {
	display: none;
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
	@apply border-0 bg-primary px-[5px] text-on-primary hover:bg-primary/50 rounded-[3px] m-0.5;
}

.ib-input-row {
	@apply flex flex-row flex-wrap w-full gap-0.5  align-baseline justify-stretch;
}

.ib-textinput {
	@apply grow shrink basis-20;
}

.ib-textinput input {
	@apply mt-0.5 block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500;
}

.ib-select {
	@apply grow shrink basis-20;
}

.ib-select select {
	@apply w-full h-full bg-gray-300 rounded;
}

.ib-submit {
	@apply shrink basis-6;
}

.ib-submit button {
	@apply h-full border-2 border-gray-300 w-full px-[5px] text-gray-900 hover:bg-primary/50 hover:text-on-primary rounded-[3px];
}
</style>
