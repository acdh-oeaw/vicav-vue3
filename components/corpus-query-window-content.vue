<script setup lang="ts">
import { Info } from "lucide-vue-next";

import type { CorpusSearchHits } from "@/lib/api-client";
import type { CorpusQuerySchema } from "@/types/global";

const api = useApiClient();
const { simpleItems } = useTEIHeaders();
const props = defineProps<{ params: Zod.infer<typeof CorpusQuerySchema>["params"] }>();
const queryString = ref(props.params.queryString);
const hits = ref<Array<CorpusSearchHits & { label?: string }> | undefined>([]);
const showHelp = ref<boolean>(false);
async function searchCorpus() {
	if (!queryString.value && words.value.length > 0)
		queryString.value = `[word="${words.value.join("|")}"]`;

	const result = await api.vicav.searchCorpus(
		{ query: queryString.value },
		{ headers: { Accept: "application/json" } },
	);

	if (result.error) {
		console.error(result.error);
		return;
	}
	hits.value = result.data.hits;
	hits.value?.forEach((hit) => {
		const teiHeader = simpleItems.value.find((header) => header.id === hit.doc);
		hit.label = teiHeader?.label;
	});
}

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

const words: Ref<Array<string>> = ref([]);
</script>

<template>
	<!-- eslint-disable vue/no-v-html -->
	<div class="p-2">
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 px-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<label class="mb-2 flex w-48! p-0 font-bold" for="word_tags">
				<span class="grow">Search for exact words</span>
				<a href="#" title="More information" @click="showHelp = true"
					><span class="hidden">More information</span><Info class="size-4"
				/></a>
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
				<Info class="size-4" /><span class="text-gray-500"
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
				@submit="searchCorpus"
			/>
			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="queryString === '' && words.length == 0"
				@click.prevent.stop="searchCorpus"
			>
				Query
			</button>
			<br />
		</form>
		<div>
			<div v-if="hits === undefined || hits.length > 0" class="my-2">
				Query: "{{ queryString }}"
			</div>
			<table>
				<tr v-for="hit in hits" :key="hit.u">
					<td class="p-0">
						<a
							:data-hits="hit.docHits"
							:data-label="hit.label"
							data-target-type="CorpusText"
							:data-text-id="hit.doc"
							:data-u="hit.u"
							href="#"
							@click="openNewWindowFromAnchor"
						>
							<strong>{{ hit.u }}</strong>
						</a>
					</td>
					<td class="pl-5 text-right" v-html="hit.content?.left"></td>
					<td class="max-w-fit bg-[beige] text-center" v-html="hit.content?.kwic"></td>
					<td class="p-0" v-html="hit.content?.right"></td>
				</tr>
			</table>
		</div>
	</div>
</template>
