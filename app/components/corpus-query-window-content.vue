<script setup lang="ts">
import { Info } from "@lucide/vue";
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

const inlineLemmaAnnotations = ref<false | true | "indeterminate">(true);
const inlineLinguisticAnnotations = ref<false | true | "indeterminate">(true);
const inlineTranslations = ref<false | true | "indeterminate">(true);
const words: Ref<Array<string>> = ref([]);

const currentPage = ref(0);
const scrollComplete = ref<boolean>(false);
const lastRestoredQueryString = ref<string>();
const {
	hasInlineTranslations: blockHasInlineTranslations,
	hasLemmaAnnotations: blockHasLemmaAnnotations,
	hasLinguisticAnnotations: blockHasLinguisticAnnotations,
} = useCorpusAnnotationAvailability();

const hasLemmaAnnotations = computed(() => {
	return blockHasLemmaAnnotations(hits.value);
});

const hasLinguisticAnnotations = computed(() => {
	return blockHasLinguisticAnnotations(hits.value);
});

const hasInlineTranslations = computed(() => {
	return blockHasInlineTranslations(hits.value);
});

const showLemmaAnnotations = computed(() => {
	return hasLemmaAnnotations.value && inlineLemmaAnnotations.value === true;
});

const showLinguisticAnnotations = computed(() => {
	return hasLinguisticAnnotations.value && inlineLinguisticAnnotations.value === true;
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

function submitSearchCorpus() {
	void searchCorpus();
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
		void searchCorpus({ updateRoute: false });
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

function utteranceContentContainsHit(
	utterance: MixedUtteranceContent[number],
	hitId?: string,
): boolean {
	if (hitId == null) return false;
	return (
		utterance.w?.["@id"] === hitId ||
		utterance.seg?.["@id"] === hitId ||
		utterance.seg?.["$$"].some((segUtterance) =>
			utteranceContentContainsHit(segUtterance, hitId),
		) === true
	);
}

function getHitKey(hit: Div, index: number) {
	return [hit["@docRef"], hit["@id"], hit.hits?.join(","), index].filter(Boolean).join("-");
}

function splitUtterancesAroundHit(utterances: MixedUtteranceContent, hitId?: string) {
	const matchIndex = utterances.findIndex((utterance) =>
		utteranceContentContainsHit(utterance, hitId),
	);

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
</script>

<template>
	<!-- eslint-disable vue/no-v-html -->
	<div class="p-2">
		<form
			class="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 px-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<label class="mb-2 flex w-48! p-0 font-bold" for="word_tags">
				<span class="grow">Search for exact words</span>
				<a href="#" title="More information" @click="showHelp = true"
					><span class="hidden">More information</span>
					<Info class="size-4" />
				</a>
			</label>
			<div v-if="showHelp" class="flex items-center gap-2">
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
			</div>
			<TagsSelect
				v-if="wordOptions"
				id="word_tags"
				v-model="words"
				v-model:search-term="wordSearch"
				:filter-function="(i) => i"
				:options="wordOptions"
				placeholder="Search for words..."
				:special-characters="specialCharacters"
			/>

			<label class="mb-2 flex w-40! p-0 font-bold" for="word_tags">
				<span class="grow">Advanced search</span>
			</label>
			<div class="mb-2 flex items-center gap-2">
				<Info class="size-4" />
				<span class="text-gray-500"
					>Enter a proper CQL query with exact transliateration characters. (<a
						class="content-center"
						href="https://howto.acdh.oeaw.ac.at/de/resources/corpus-query-language-im-austrian-media-corpus"
						target="_blank"
						title="More information about CQL syntax"
						><span>More info</span></a
					>)
				</span>
			</div>
			<InputExtended
				v-if="specialCharacters"
				id="query"
				v-model="queryString"
				aria-label="Search"
				placeholder="Search in corpus ..."
				:special-characters="specialCharacters"
				@submit="submitSearchCorpus"
			/>
			<button
				class="inline-block h-10 w-full rounded-sm border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold whitespace-nowrap text-primary hover:bg-primary hover:text-on-primary hover:disabled:bg-on-primary hover:disabled:text-gray-400 disabled:border-gray-400 disabled:text-gray-400"
				:disabled="isSearching || (queryString === '' && words.length == 0)"
				@click.prevent.stop="submitSearchCorpus"
			>
				Query
			</button>
			<br />
		</form>
		<div
			v-if="hasLemmaAnnotations || hasLinguisticAnnotations || hasInlineTranslations"
			class="flex justify-end gap-3 p-4"
		>
			<div v-if="hasLemmaAnnotations">
				<Checkbox
					id="switch-lemma-annotations"
					:checked="inlineLemmaAnnotations === true"
					@update:checked="inlineLemmaAnnotations = $event === true"
				/>
				<label for="switch-lemma-annotations">&nbsp;Lemma annotations</label>
			</div>
			<div v-if="hasLinguisticAnnotations">
				<Checkbox
					id="switch-linguistic-annotations"
					:checked="inlineLinguisticAnnotations === true"
					@update:checked="inlineLinguisticAnnotations = $event === true"
				/>
				<label for="switch-linguistic-annotations">&nbsp;Linguistic annotations</label>
			</div>
			<div v-if="hasInlineTranslations">
				<Checkbox
					id="switch-translations"
					:checked="inlineTranslations === true"
					@update:checked="inlineTranslations = $event === true"
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
				<tr v-for="(hit, hitIndex) in displayHits" :key="getHitKey(hit, hitIndex)">
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
										:hits="hit.hits?.[0]"
										:inline-lemma-annotation="showLemmaAnnotations"
										:inline-linguistic-annotation="showLinguisticAnnotations"
										:utterance="uContent"
									></CorpusTextJsonUtterance>
								</div>
								<div class="min-w-fit justify-self-center">
									<CorpusTextJsonUtterance
										v-if="splitUtterancesAroundHit(hit.u['$$'], hit.hits?.[0]).match"
										:highlight="true"
										:hits="hit.hits?.[0]"
										:inline-lemma-annotation="showLemmaAnnotations"
										:inline-linguistic-annotation="showLinguisticAnnotations"
										:utterance="splitUtterancesAroundHit(hit.u['$$'], hit.hits?.[0]).match!"
									></CorpusTextJsonUtterance>
								</div>
								<div class="flex flex-nowrap justify-self-start">
									<CorpusTextJsonUtterance
										v-for="(uContent, index) in splitUtterancesAroundHit(hit.u['$$'], hit.hits?.[0])
											.after"
										:key="`after-${index}`"
										:hits="hit.hits?.[0]"
										:inline-lemma-annotation="showLemmaAnnotations"
										:inline-linguistic-annotation="showLinguisticAnnotations"
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
