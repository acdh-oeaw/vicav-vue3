<script setup lang="ts">
import type { CorpusSearchHits } from "@/lib/api-client";
import type { CorpusQuerySchema } from "@/types/global";

const api = useApiClient();

const props = defineProps<{ params: Zod.infer<typeof CorpusQuerySchema>["params"] }>();

const queryString = ref(props.params.queryString);
const hits = ref<Array<CorpusSearchHits> | undefined>([]);

async function searchCorpus() {
	const result = await api.vicav.searchCorpus(
		{ query: queryString.value },
		{ headers: { Accept: "application/json" } },
	);

	if (result.error) {
		console.error(result.error);
		return;
	}
	hits.value = result.data.hits;
}

const openNewWindowFromAnchor = useAnchorClickHandler();

const specialCharacters: Array<string> = [
	"ē",
	"ṛ",
	"ṯ",
	"ẓ",
	"ū",
	"ī",
	"ō",
	"ā",
	"š",
	"ḏ",
	"ṭ",
	"ǧ",
	"ḥ",
	"ž",
	"ṣ",
	"ḏ̣",
	"ʕ",
	"ʔ",
	"ġ",
	"ḅ",
	"ṃ",
];
</script>

<template>
	<!-- eslint-disable vue/no-v-html -->
	<div class="p-2">
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<InputExtended
				v-model="queryString"
				:string-snippets="specialCharacters"
				placeholder="Search in corpus ..."
				aria-label="Search"
				@submit="searchCorpus"
			/>
			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="queryString === ''"
				@click.prevent.stop="searchCorpus"
			>
				Query
			</button>
			<br />
		</form>
		<div>
			<div v-if="hits === undefined || hits.length > 0">
				TODO write the CQL here: "{{ queryString }}"
			</div>
			<table>
				<tr v-for="hit in hits" :key="hit.u">
					<td class="p-0 pe-3">
						<a
							href="#"
							data-target-type="CorpusText"
							:data-hits="hit.docHits"
							:data-doc="hit.doc"
							:data-uid="hit.u"
							@click.self="openNewWindowFromAnchor"
						>
							<strong>{{ hit.u }}</strong>
						</a>
					</td>
					<td class="p-0 text-right" v-html="'TODO: hit.content.left'"></td>
					<td class="bg-[beige] p-0 text-center" v-html="'TODO: hit.content.kwic'"></td>
					<td class="p-0" v-html="'TODO: hit.content.right'"></td>
				</tr>
			</table>
		</div>
	</div>
</template>

<style>
/* InputExtended stylesheet */
.ie button {
	@apply border-gray-300 bg-gray-200 border px-2 py-px font-bold text-gray-800 hover:bg-gray-300 rounded-sm m-px;
}

.ie input {
	@apply my-2 border px-3 py-2 w-full shadow;
}
</style>
