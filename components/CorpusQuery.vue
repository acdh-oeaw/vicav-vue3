<template>
	<div id="corpus-query">
		<form class="newQueryForm form-inline mt-2 mt-md-0">
			<input
				class="form-control mr-sm-2"
				type="text"
				v-model="queryString"
				style="flex: 1;"
				placeholder="Search in corpus ..."
				aria-label="Search"
			/>
			<button class="corpusQueryBtn" @click.prevent.stop="QueryButtonClicked" :disabled="queryString === ''">
				Query</button
			><br />
		</form>
		<div v-for="hit in hits">
			<a @click.prevent.stop="openCorpusText">
				<strong>{{ hit.doc }}</strong>
			</a>
			<div class="corpus-search-results" v-html="hit.content"></div>
		</div>
	</div>
</template>

<script lang="ts">
import { useWMStore } from '~~/store/wm';
const WMStore = useWMStore()
const { $api } = useNuxtApp();

export default {
	data() {
		return {
			queryString: "",
			resultHtml: "",
			hits: []
		};
	},
	methods: {
		QueryButtonClicked: async function (e)  {
			console.log("s")
			const result = await this.$api.corpus.searchCorpus(
				{ query: this.queryString },
				{ headers: { 'Accept': 'application/json' }})

			if (result.error) return false;
			this.resultQuery = result.data.query
			this.hits = result.data.hits;
		},
		openCorpusText(e) {
			WMStore.Open("CorpusText", { textId: e.target.innerText })
		}
	},
};
</script>

<style lang="scss">
#corpus-query {
	padding: 1rem;
}


.corpus-search-result {
	display: grid;
    grid-template-columns: 2fr 1fr 2fr;
    width: 100%;

	> .left {
	  text-align: right;
	  writing-mode: horizontal-rl;
	  text-wrap: nowrap;
	  text-overflow: ellipsis;
	}
	> .keyword {
	  text-align: center;
	  padding-left: 1em;
	  padding-right: 1em;
	  background-color: yellow;
	}
	> .right {
	  text-align: left;
	}
}
</style>
