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
			textId: e.currentTarget.dataset.doc,
			hits: e.currentTarget.dataset.hits,
			u: e.currentTarget.dataset.uid,
		},
	});
}
</script>

<template>
	<div id="corpus-query" class="p-2">
		<form class="d-flex">
			<input
				v-model="queryString"
				class="form-control me-2"
				type="text"
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
			<div v-if="hits.length > 0">CQL: [word="{{ queryString }}"]</div>
			<table>
				<tr v-for="hit in hits" :key="hit.u" class="hit flex">
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
					<td class="corpus-search-results" v-html="hit.content"></td>
				</tr>
			</table>
		</div>
	</div>
</template>

<style lang="scss">
#corpus-query {
	padding: 1rem;
}
</style>
