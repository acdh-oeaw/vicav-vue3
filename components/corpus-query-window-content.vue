<script setup lang="ts">
import { Info } from "lucide-vue-next";

import type { CorpusSearchHits } from "@/lib/api-client";
import type { CorpusQuerySchema } from "@/types/global";

const api = useApiClient();
const { simpleItems } = useTEIHeaders();
const props = defineProps<{ params: Zod.infer<typeof CorpusQuerySchema>["params"] }>();
const queryString = ref(props.params.queryString);
const hits = ref<Array<CorpusSearchHits & { label?: string }> | undefined>([]);

async function searchCorpus() {
	if (words.value.length > 0)
		queryString.value =
			'[word="' + words.value.map((w) => w.replace("*", ".*").replace("?", ".")).join("|") + '"]';

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
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<label class="font-bold" for="word_tags">Search for words</label>
			<TagsSelect
				v-if="wordOptions"
				id="word_tags"
				v-model="words"
				v-model:search-term="wordSearch"
				:filter-function="(i) => i"
				:options="wordOptions"
				:placeholder="`Search for words...`"
			/>
			<label class="flex !w-40 font-bold" for="query"
				><span class="grow">Advanced search</span>
				<a
					class="content-center"
					href="https://howto.acdh.oeaw.ac.at/de/resources/corpus-query-language-im-austrian-media-corpus"
					target="_blank"
					title="More information about CQL syntax"
					><Info class="size-4" /><span class="hidden">More information about CQL Syntax</span></a
				>
			</label>

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
					<td class="max-w-fit bg-[beige] px-[2px] text-center" v-html="hit.content?.kwic"></td>
					<td class="p-0" v-html="hit.content?.right"></td>
				</tr>
			</table>
		</div>
	</div>
</template>
