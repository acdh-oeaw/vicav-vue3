<script setup lang="ts">
const windowsStore = useWindowsStore();
const api = useApiClient();

const queryString = ref("");
const hits = ref([]);

async function QueryButtonClicked() {
	const result = await api.vicav.searchCorpus(
		{ query: queryString.value },
		{ headers: { Accept: "application/json" } },
	);

	if (result.error) return false;
	hits.value = result.data.hits;
}

function openCorpusText(e) {
	windowsStore.addWindow({
		kind: "corpus-text",
		title: "shawi corpus",
		params: {
			id: e.currentTarget.dataset.doc,
			hits: e.currentTarget.dataset.hits,
			u: e.currentTarget.dataset.uid,
		},
	});
}

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
	<div id="corpus-query" class="p-2">
		<form class="d-flex">
			<InputExtended
				v-model="queryString"
				:string-snippets="specialCharacters"
				class="form-control me-2"
				style="flex: 1"
				placeholder="Search in corpus ..."
				aria-label="Search"
			/>
			<button
				class="corpusQueryBtn"
				:disabled="queryString === ''"
				@click.prevent.stop="QueryButtonClicked"
			>
				Query
			</button>
			<br />
		</form>
		<div class="results">
			<div v-if="hits.length > 0">TODO write the CQL here: "{{ queryString }}"</div>
			<table>
				<tr v-for="hit in hits" :key="hit.u" class="hit">
					<td class="pe-3">
						<a
							href="#"
							:data-hits="hit.docHits"
							:data-doc="hit.doc"
							:data-uid="hit.u"
							@click.prevent="openCorpusText"
						>
							<strong>{{ hit.u }}</strong>
						</a>
					</td>
					<td class="left" v-html="hit.content.left"></td>
					<td class="kwic bg-warning" v-html="hit.content.kwic"></td>
					<td class="right" v-html="hit.content.right"></td>
				</tr>
			</table>
		</div>
	</div>
</template>

<style lang="scss">
#corpus-query {
	padding: 1rem;
}

.results td {
	padding: 0 0 0 0;
}

.left {
	text-align: right;
}

.kwic {
	text-align: center;
}

.bg-warning {
	background-color: beige;
}

/* InputExtended stylesheet */
.ie button {
	@apply bg-gray-300 px-4 py-2 font-bold text-gray-800 hover:bg-gray-400;
}

.ie input {
	@apply m-2 border px-3 py-2 shadow;
}
</style>
