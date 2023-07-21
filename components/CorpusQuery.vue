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
			<button class="corpusQueryBtn" @click="QueryButtonClicked" :disabled="queryString === ''">
				Query</button
			><br />
		</form>
		{{ resultQuery }}
		<ul class="selQueryType">
			<!-- <li v-for="dict in dictList" :key="dict.id">
				<input type="checkbox" v-model="dict.selected" :id="'cb' + dict.id.toUpperCase()" />
				<label class="checkboxLabel" :for="'cb' + dict.id.toUpperCase()">{{ dict.name }}</label>
			</li> -->
		</ul>
		<p>
			<!-- For details as to how to formulate meaningful dictionary queries consult the
			<a class="aVicText" href="" @click="UndefinedLink">examples of the TUNICO dictionary</a>. -->
		</p>
		<div v-for="hit in hits">
			<a href="#" click="openCorpusText(hit.doc)">
				<strong>{{ hit.doc }}</strong>
			</a>
			<div class="corpus-search-results" v-html="hit.content"></div>
		</div>
	</div>
</template>

<script>
//import axios from "axios";



//import { useDictStore } from '~~/store/dict'
//import { storeToRefs } from 'pinia';

export default {
	props: ["params"],
	emits: ["new-window"],
	setup() {
		// const dictStore = useDictStore()
		// const { dictList, dictCrossQueryXslt } = storeToRefs(dictStore)
		// return {
		// 	dictList,
		// 	dictCrossQueryXslt,
		// }
		const { $api } = useNuxtApp();
		$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);

		return {
			$api
		}
	},
	data() {
		return {
			queryString: "",
			resultHtml: "",
			hits: []
		};
	},
	computed: {
		// normalizedQueryString() {
		// 	if (this.queryString === "") {
		// 		return "";
		// 	}
		// 	var newString = this.queryString
		// 		.split("&")
		// 		.map(e => e.split(","))
		// 		.flat()
		// 		.map(e => e.trim())
		// 		.filter(e => e != "")
		// 		.map(e => (e.indexOf("=") == -1) ? 'any="' + e + '"' : e)
		// 		.join(",");
		// 	return newString;
		// },
		// normalizedDictList() {
		// 	var newString = Object.keys(this.dictList)
		// 		.filter(e => this.dictList[e].selected)
		// 		.map(e => this.dictList[e].coll_name)
		// 		.join(",");
		// 	return newString;
		// },
	},
	methods: {
		QueryButtonClicked: async function (e)  {
	e.preventDefault();
	const result = await this.$api.corpus.searchCorpus(
		{ query: this.queryString },
		{ headers: { 'Accept': 'application/json' }})

	if (result.error) return false;
	this.resultQuery = result.data.query
	this.hits = result.data.hits;


	// axios
	// 	.get(
	// 		 import.meta.env.VITE_APIBASEURL + "/corpus" +
	// 			"?query=" + this.queryString // +
	// 			// "&dicts=" + this.normalizedDictList +
	// 			// "&xslt=" + this.dictCrossQueryXslt,
	// 	)
	// 	.then(response => {
	// 		this.resultHtml = response.data //this.PostProcessResultList(response.data);
	// 		//this.MakeDictEntryLinksClickable();
	// 	})
	// 	.catch(error => {
	// 		console.error(error);
	// 	});
}
		// // // PostProcessResultList(resultList) {
		// // // 	return resultList
		// // // 		.split(/\r\n/)
		// // // 		.map(str =>
		// // // 			str.replace(
		// // // 				/href=\"javascript:getDBSnippet\(&#34;(dictID:.*)&#34;\)\"/i,
		// // // 				'href="" data-params="$1"',
		// // // 			),
		// // // 		)
		// // // 		.join("\r\n");
		// // // },
		// // // MakeDictEntryLinksClickable() {
		// // // 	this.$nextTick(() => {
		// // // 		Array.prototype.slice.call(document.querySelectorAll('[data-params^="dictID"]')).map(
		// // // 			el => (el.onclick = e => {
		// // // 				e.preventDefault();
		// // // 				e.stopPropagation();
		// // // 				this.$emit("new-window", {
		// // // 					id: "vv-dict-entry",
		// // // 					title: "Dictionary entry " + e.target.dataset.params,
		// // // 					component: {
		// // // 						name: "DictEntry",
		// // // 						params: this.GetDbSnippetParams(e.target.dataset.params),
		// // // 					},
		// // // 				});
		// // // 			}),
		// // // 		);
		// // // 	});
		// // // },
		// // GetDbSnippetParams(params) {
		// // 	let splitPoint = params.indexOf(":");
		// // 	let sHead = params.substr(0, splitPoint);
		// // 	let sTail = params.substring(splitPoint + 1);
		// // 	let sh = sTail.split("/");
		// // 	let snippetID = sh[0].trim();
		// // 	let secLabel = "";
		// // 	if (!!sh[1]) {
		// // 		secLabel = sh[1].trim();
		// // 		secLabel = secLabel.replace(/_/g, " ");
		// // 	}
		// // 	let sid = null;
		// // 	let dict = null;
		// // 	switch (sHead) {
		// // 		case "dictID":
		// // 			let st5 = sTail.split(",");
		// // 			sid = st5[0];
		// // 			dict = this.dictList.find(dict => dict.query_selector == st5[1]);
		// // 			if (dict == null) {
		// // 				return "UNKNOWN_DICTIONARY";
		// // 			}
		// // 			break;
		// // 		default:
		// // 			return "NOT_IMPLEMENTED";
		// // 	}
		// // 	return { dict, sid };
		// // },
		// UndefinedLink() {
		// 	alert("This link is undefined.");
		// },
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
