<script setup lang="ts">
	import { useDictStore, IDictionary } from "~~/store/dict"
    import { useWMStore } from '~~/store/wm';
	import { Ref } from "@vue/runtime-dom"

	const props = defineProps(['params'])

	const dictStore = useDictStore()
	const dictList = computed(() => dictStore.dictList)
	const dictSelector: Ref<{ [dictId: string]: boolean }> = ref({})
	dictList.value.forEach(d => { dictSelector.value[d.coll_name] = (props.params?.dictId == d.coll_name) })
	if (!Object.keys(dictSelector.value).some(d => dictSelector.value[d])) {
		Object.keys(dictSelector.value).forEach(d => { dictSelector.value[d] = true })
	}
	const normalizedDictList = computed(() => {
		var newString = Object.keys(dictSelector.value)
			.filter((e: string) => dictSelector.value[e])
			.join(",")
		return newString
	})
	const dictCrossQueryXslt = computed(() => dictStore.dictCrossQueryXslt)

	const queryString: Ref<string> = ref('')
	const normalizedQueryString = computed(() => {
		if (queryString.value === "") {
			return ""
		}
		let newString = queryString.value
			.split("&")
			.map((e: string) => e.split(","))
			.flat()
			.map((e: string) => e.trim())
			.filter((e: string) => e != "")
			.map((e: string) => (e.indexOf("=") == -1) ? 'any="' + e + '"' : e)
			.join(",")
		return newString
	})

	const queryDictionaries = async () => {
		const { $api } = useNuxtApp()
		$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
		try {
			return (await $api.vicav.getDictApi({
				query: normalizedQueryString.value,
				dict: normalizedDictList.value,
				xslt: dictCrossQueryXslt.value
			})).text()
		} catch (error) {
			logError(error)
		}
	}

	const logError = async (error: any) => {
		let errorXml = (new DOMParser()).parseFromString(await error.text(), 'text/xml')
			console.error(errorXml)
			alert(
				'Status: ' + errorXml.querySelector('status')?.textContent + '\n\n'
				+ errorXml.querySelector('title')?.textContent + '\n\n'
				+ errorXml.querySelector('detail')?.textContent + '\n\n'
				+ 'Trace: ' + errorXml.querySelector('trace')?.textContent
			)
	}

	const resultHtml: Ref<string | undefined> = ref('')

	const domId = 'id-' + Math.floor(Math.random() * 1000000)
    const wmStore = useWMStore()

	const queryButtonClicked = async (e: Event) => {
		e.preventDefault()
		resultHtml.value = await queryDictionaries()
		nextTick(() => {
			wmStore.sanitizeLinks(domId)
		})
	}

	const openExamples = (e: Event) => {
		e.preventDefault()
		wmStore.open('Text', 'textQuery: TUNICO DICTIONARY', { id: 'dictFrontPage_Tunis', customClass: 'vicav-cover-page' })
	}
</script>

<template>
	<div class="vv-dict-query">
		<form class="newQueryForm form-inline mt-2 mt-md-0">
			<input
				class="form-control mr-sm-2"
				type="text"
				v-model="queryString"
				style="flex: 1;"
				placeholder="Search in dictionaries ..."
				aria-label="Search"
			/>
			<button class="crossDictQueryBtn" @click="queryButtonClicked" :disabled="queryString === '' || !Object.keys(dictSelector).some(d => dictSelector[d])">
				Query</button
			><br />
		</form>
		<span style="font: small;">Normalized query string: {{ normalizedQueryString }}</span><br />
		<span style="font: small;">Normalized dictionary list: {{ normalizedDictList }}</span>
		<ul class="selQueryType">
			<li v-for="dict in dictList" :key="dict.id">
				<input type="checkbox" v-model="dictSelector[dict.coll_name]" :id="dict.id" />
				<label class="checkboxLabel" :for="dict.id">{{ dict.name }}</label>
			</li>
		</ul>
		<p>
			For details as to how to formulate meaningful dictionary queries consult the
			<a class="aVicText" href="" @click="openExamples">examples of the TUNICO dictionary</a>.
		</p>
		<div v-html="resultHtml" :id="domId"></div>
	</div>
</template>

<style lang="scss" scoped>
.vv-dict-query {
	padding: 20px;
}

.biblQueryBtn, .crossDictQueryBtn {
    width: 300px;
    height: 40px;
    color: rgb(168, 93, 143);
    border: 2px solid rgb(168, 93, 143);
    font-weight: bold;
    background: white;
    display: inline-block;
    font-weight: 400;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    border-radius: 0.25rem;
}
.biblQueryBtn:disabled, .crossDictQueryBtn:disabled {
	opacity: 0.3;
	background-color: lightgrey;
}

.selQueryType {
    display: block;
    margin-top: 5px;
    margin-left: 3px;
    /* border: 1px solid black; */
}
</style>
