<script setup lang="ts">
import { Info } from "lucide-vue-next";
import InfiniteLoading from "v3-infinite-loading";
import type { StateHandler } from "v3-infinite-loading/lib/types";
import type Zod from "zod";

import type { Div, MixedUtteranceContent } from "@/lib/api-client";
import { useTeiHeadersStore } from "@/stores/use-tei-headers-store.ts";
import type { CorpusQuerySchema } from "@/types/global.ts";

const api = useApiClient();
const { simpleItems } = useTeiHeadersStore();
const props = defineProps<{ params: Zod.infer<typeof CorpusQuerySchema>["params"] }>();
const emit = defineEmits<{
	updateQueryParam: [queryString: string];
}>();
const queryString = ref(props.params.queryString);
const hits = ref<Array<Div & { label?: string }>>([]);
const displayHits = ref<Array<Div & { label?: string }>>([]);
const showHelp = ref<boolean>(false);
const isSearching = ref(false);

const inlineAnnotations = ref<false | true | "indeterminate">(true);
const inlineTranslations = ref<false | true | "indeterminate">(true);
const words: Ref<Array<string>> = ref([]);

const currentPage = ref(0);
const scrollComplete = ref<boolean>(false);
const lastRestoredQueryString = ref<string>();
const {
	hasInlineAnnotations: blockHasInlineAnnotations,
	hasInlineTranslations: blockHasInlineTranslations,
} = useCorpusAnnotationAvailability();

const hasInlineAnnotations = computed(() => {
	return blockHasInlineAnnotations(hits.value);
});

const hasInlineTranslations = computed(() => {
	return blockHasInlineTranslations(hits.value);
});

const showInlineAnnotations = computed(() => {
	return hasInlineAnnotations.value && inlineAnnotations.value === true;
});

const showInlineTranslations = computed(() => {
	return hasInlineTranslations.value && inlineTranslations.value === true;
});

async function searchCorpus(options: { updateRoute?: boolean } = {}) {
	const { updateRoute = true } = options;
	isSearching.value = true;
	currentPage.value = 0;
	hits.value = [];
	displayHits.value = [];
	try {
		if (words.value.length > 0) queryString.value = `[word="${words.value.join("|")}"]`;
		if (updateRoute) emit("updateQueryParam", queryString.value);

		const result = await api.vicav.searchCorpus(
			{
				query: queryString.value.toString(),
				render: "json",
			},
			{ headers: { Accept: "application/json" } },
		);

		if (result.error) {
			console.error(result.error);
			return;
		}
		if (result.data.hits !== undefined && !Array.isArray(result.data.hits)) {
			if (Array.isArray(result.data.hits.divs)) hits.value = result.data.hits.divs;
			else if (result.data.hits.div) hits.value.push(result.data.hits.div);
			hits.value?.forEach((hit) => {
				const teiHeader = simpleItems.find((header) => header.id === hit["@docRef"]);
				hit.label = teiHeader?.label;
			});
			displayHits.value = hits.value.slice(currentPage.value * 10, (currentPage.value + 1) * 10);
			scrollComplete.value = false;
		}
	} finally {
		isSearching.value = false;
	}
}

// API currently doesn't support pagination for corpus search results, so we're faking it
const handleInfiniteScroll = async function ($state: StateHandler) {
	currentPage.value += 1;
	const nextHits = hits.value.slice(currentPage.value * 10, (currentPage.value + 1) * 10);
	if (nextHits.length > 0) {
		displayHits.value = displayHits.value.concat(nextHits);
		$state.loaded();
	} else {
		scrollComplete.value = true;
		$state.complete();
	}
};

watch(
	() => props.params.queryString,
	(value) => {
		if (value === "" || value === lastRestoredQueryString.value) return;
		queryString.value = value;
		lastRestoredQueryString.value = value;
		if (!isSearching.value) void searchCorpus({ updateRoute: false });
	},
	{ flush: "post", immediate: true },
);

const openNewWindowFromAnchor = useAnchorClickHandler();

const { data: config } = useProjectInfo();
const specialCharacters = config.value?.projectConfig?.specialCharacters;
const wordSearch = ref("");
const dataWordsQuery = useDataWords(
	{ dataType: "CorpusText", query: wordSearch },
	{ enabled: false },
);

watch(wordSearch, async (value) => {
	if (!value || value.length < 2) return;
	await dataWordsQuery.refetch();
});

const wordOptions = computed(() => {
	return ((dataWordsQuery.data.value as unknown as Array<string>) ?? []).map((item: string) => {
		return { label: item, value: item };
	});
});

function splitUtterancesAroundHit(utterances: MixedUtteranceContent, hitId?: string) {
	const matchIndex = utterances.findIndex((utterance) => utterance.w?.["@id"] === hitId);

	if (matchIndex === -1) {
		return {
			before: utterances,
			match: undefined,
			after: [],
		};
	}

	return {
		before: utterances.slice(0, matchIndex),
		match: utterances[matchIndex],
		after: utterances.slice(matchIndex + 1),
	};
}

const { cqlConfig: attributeConfig } = useCqlAttributes();

const cqlConfig = computed<CqlConfig>(() =>
	attributeConfig.value.map((attr) =>
		// `word` suggestions are fetched dynamically (driven by `wordSearch` below).
		attr.key === "word"
			? {
					...attr,
					values: wordOptions.value.map((o) => ({ value: o.value, displayValue: o.label })),
				}
			: attr,
	),
);
const { cqlTriggers } = useCqlTriggers(cqlConfig);
</script>

<template>
	<!-- eslint-disable vue/no-v-html -->
	<div class="p-2">
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 px-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<label class="mb-2 flex p-0 font-bold" for="word_tags">
				<span class="mr-2">Search for words or enter a CQL query</span>
				<a href="#" title="More information" @click="showHelp = !showHelp"
					><span class="hidden">More information</span>
					<Info class="size-4" />
				</a>
			</label>
			<div v-if="showHelp" class="mb-2 flex flex-col gap-2">
				<span class="text-gray-500"
					>Enter beginning of the word to trigger autocomplete suggestions from the words occurring
					in the corpus. Autocomplete is accent-insensitive, allowing for a simplified word form
					selection. Eg. "wa" will return results starting with "wā" or "ẉa" as well. <br />
					Apart from the accent-insensitivity, "?" is used as a shortcut for ʔalif or ʕayn.<br />
					Instead of choosing exact word forms from autocomplete results, you can enter a word with
					wildcards and add it to the queried words by pressing enter. Supported wildcards: ".?"
					stand for one character ".*" stands for multiple characters. characters.<br />
					Example: w.?n would yield results like "wen", "win", "w.*n" would yield results for "wen,
					win or weyn" as well.
				</span>
				<span class="text-gray-500"
					>Alternatively, enter a proper CQL query with exact transliateration characters. (<a
						class="content-center"
						href="https://campus.dariah.eu/resources/hosted/corpus-query-language-im-austrian-media-corpus"
						target="_blank"
						title="More information about CQL syntax"
						><span>More info</span></a
					>)
				</span>
			</div>
			<Searchbar
				v-model="queryString"
				v-model:search-term="wordSearch"
				:dynamic-keys="['word']"
				feature-trigger="["
				free-trigger-key="word"
				:on-submit="
					(v) => {
						if (!isSearching) {
							queryString = v;
							searchCorpus();
						}
					}
				"
				query-mode="cql"
				:special-characters="specialCharacters"
				:triggers="cqlTriggers"
			/>
			<br />
		</form>
		<div v-if="hasInlineAnnotations || hasInlineTranslations" class="flex justify-end p-4">
			<div v-if="hasInlineAnnotations">
				<Checkbox
					id="switch-annotations"
					:default-checked="true"
					@update:checked="inlineAnnotations = !inlineAnnotations"
				/>
				<label for="switch-annotations">&nbsp;Inline Annotations</label>
			</div>
			<span v-if="hasInlineAnnotations && hasInlineTranslations">&nbsp;</span>
			<div v-if="hasInlineTranslations">
				<Checkbox
					id="switch-translations"
					:default-checked="true"
					@update:checked="inlineTranslations = !inlineTranslations"
				/>
				<label for="switch-translations">&nbsp;Inline Translations</label>
			</div>
		</div>
		<div v-if="isSearching" class="flex justify-center py-4 text-primary">
			<LoadingIndicator>Loading corpus results...</LoadingIndicator>
		</div>
		<div v-if="hits && displayHits.length > 0">
			<div class="my-2">Query: "{{ queryString }}"</div>
			<table>
				<tr v-for="hit in displayHits" :key="hit['@id']">
					<td class="p-0">
						<a
							:data-hits="hit.hits![0]"
							data-target-type="CorpusText"
							:data-text-id="hit['@docRef']"
							:data-u="hit.u"
							href="#"
							@click="openNewWindowFromAnchor"
						>
							<strong>{{ hit["@docRef"] }}</strong>
						</a>
					</td>
					<td>
						<div v-if="hit.u" class="overflow-x-auto px-6 py-3">
							<div
								class="inline-grid min-w-full grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] items-start gap-x-3"
							>
								<div class="flex flex-nowrap justify-end justify-self-end">
									<CorpusTextJsonUtterance
										v-for="(uContent, index) in splitUtterancesAroundHit(hit.u['$$'], hit.hits?.[0])
											.before"
										:key="`before-${index}`"
										:inline-annotation="showInlineAnnotations"
										:inline-translation="showInlineTranslations"
										:utterance="uContent"
									></CorpusTextJsonUtterance>
								</div>
								<div class="min-w-fit justify-self-center">
									<CorpusTextJsonUtterance
										v-if="splitUtterancesAroundHit(hit.u['$$'], hit.hits?.[0]).match"
										:highlight="true"
										:inline-annotation="showInlineAnnotations"
										:inline-translation="showInlineTranslations"
										:utterance="splitUtterancesAroundHit(hit.u['$$'], hit.hits?.[0]).match!"
									></CorpusTextJsonUtterance>
								</div>
								<div class="flex flex-nowrap justify-self-start">
									<CorpusTextJsonUtterance
										v-for="(uContent, index) in splitUtterancesAroundHit(hit.u['$$'], hit.hits?.[0])
											.after"
										:key="`after-${index}`"
										:inline-annotation="showInlineAnnotations"
										:inline-translation="showInlineTranslations"
										:utterance="uContent"
									></CorpusTextJsonUtterance>
								</div>
							</div>
						</div>
						<div
							v-if="showInlineTranslations && hit.Translation_spanGrp"
							class="flex max-w-full flex-row px-6 py-3 italic"
						>
							{{ hit.Translation_spanGrp.span["$"] }}
						</div>
					</td>
				</tr>
			</table>
			<InfiniteLoading v-if="!scrollComplete" ref="infinite" @infinite="handleInfiniteScroll" />
		</div>
	</div>
</template>
