<template>
	<div id="dict-query">
		<form class="newQueryForm form-inline mt-2 mt-md-0">
			<input
				class="form-control mr-sm-2"
				type="text"
				v-model="queryString"
				style="flex: 1;"
				placeholder="Search in dictionaries ..."
				aria-label="Search"
			/>
			<button class="crossDictQueryBtn" @click="QueryButtonClicked" :disabled="queryString === ''">
				Query</button
			><br />
		</form>
		{{ normalizedQueryString }}<br />{{ normalizedDictList }}
		<ul class="selQueryType">
			<li v-for="dict in dictList" :key="dict.id">
				<input type="checkbox" v-model="dict.selected" :id="'cb' + dict.id.toUpperCase()" />
				<label class="checkboxLabel" :for="'cb' + dict.id.toUpperCase()">{{ dict.name }}</label>
			</li>
		</ul>
		<p>
			For details as to how to formulate meaningful dictionary queries consult the
			<a class="aVicText" href="" @click="UndefinedLink">examples of the TUNICO dictionary</a>.
		</p>
		<div v-html="resultHtml"></div>
	</div>
</template>

<script>
import axios from "axios";
import { useDictStore } from '~~/store/dict'
import { storeToRefs } from 'pinia';

export default {
	props: ["params"],
	emits: ["new-window"],
	setup() {
		const dictStore = useDictStore()
		const { dictList, dictCrossQueryXslt } = storeToRefs(dictStore)
		return {
			dictList,
			dictCrossQueryXslt,
		}
	},
	data() {
		return {
			queryString: "",
			resultHtml: "",
		};
	},
	computed: {
		normalizedQueryString() {
			if (this.queryString === "") {
				return "";
			}
			var newString = this.queryString
				.split("&")
				.map(e => e.split(","))
				.flat()
				.map(e => e.trim())
				.filter(e => e != "")
				.map(e => (e.indexOf("=") == -1) ? 'any="' + e + '"' : e)
				.join(",");
			return newString;
		},
		normalizedDictList() {
			var newString = Object.keys(this.dictList)
				.filter(e => this.dictList[e].selected)
				.map(e => this.dictList[e].coll_name)
				.join(",");
			return newString;
		},
	},
	methods: {
		QueryButtonClicked(e) {
			e.preventDefault();
			axios
				.get(
					"http://" + import.meta.env.VITE_BASEURL + "/dicts_api" +
						"?query=" + this.normalizedQueryString +
						"&dicts=" + this.normalizedDictList +
						"&xslt=" + this.dictCrossQueryXslt,
				)
				.then(response => {
					this.resultHtml = this.PostProcessResultList(response.data);
					this.MakeDictEntryLinksClickable();
				})
				.catch(error => {
					console.error(error);
				});
		},
		PostProcessResultList(resultList) {
			return resultList
				.split(/\r\n/)
				.map(str =>
					str.replace(
						/href=\"javascript:getDBSnippet\(&#34;(dictID:.*)&#34;\)\"/i,
						'href="" data-params="$1"',
					),
				)
				.join("\r\n");
		},
		MakeDictEntryLinksClickable() {
			this.$nextTick(() => {
				Array.prototype.slice.call(document.querySelectorAll('[data-params^="dictID"]')).map(
					el => (el.onclick = e => {
						e.preventDefault();
						e.stopPropagation();
						this.$emit("new-window", {
							id: "vv-dict-entry",
							title: "Dictionary entry " + e.target.dataset.params,
							component: {
								name: "DictEntry",
								params: this.GetDbSnippetParams(e.target.dataset.params),
							},
						});
					}),
				);
			});
		},
		GetDbSnippetParams(params) {
			let splitPoint = params.indexOf(":");
			let sHead = params.substr(0, splitPoint);
			let sTail = params.substring(splitPoint + 1);
			let sh = sTail.split("/");
			let snippetID = sh[0].trim();
			let secLabel = "";
			if (!!sh[1]) {
				secLabel = sh[1].trim();
				secLabel = secLabel.replace(/_/g, " ");
			}
			let sid = null;
			let dict = null;
			switch (sHead) {
				case "dictID":
					let st5 = sTail.split(",");
					sid = st5[0];
					dict = this.dictList.find(dict => dict.query_selector == st5[1]);
					if (dict == null) {
						return "UNKNOWN_DICTIONARY";
					}
					break;
				default:
					return "NOT_IMPLEMENTED";
			}
			return { dict, sid };
		},
		UndefinedLink() {
			alert("This link is undefined.");
		},
	},
};
</script>

<style lang="scss" scoped>
#dict-query {
	padding: 1rem;
}
</style>
