<template>
	<div v-html="htmlContents" class="vv-dict-entry" :id="domId"></div>
</template>

<script setup lang="ts">
	import { Ref } from "@vue/runtime-dom"
	import { useWMStore } from '~~/store/wm'

	const htmlContents: Ref<string | undefined> = ref("")
	const props = defineProps<{
		params: {
			sid: string,
			dict: string,
		},
	}>()

	const getDictEntry = async () => {
		const { $api } = useNuxtApp()
		const id = String(props.params.sid)
		const dict = String(props.params.dict)
		$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
		try {
			return (await $api.restvle.getDictDictNameEntry(dict, id)).text()
		} catch (error) {
			console.error(error)
		}
	}

	htmlContents.value = await getDictEntry()

	const domId = 'id-' + Math.floor(Math.random() * 1000000)
	const wmStore = useWMStore()
	onMounted(() => {
		wmStore.sanitizeLinks(domId)
	})
</script>

<style>
	.vv-dict-entry {
		padding: 20px;
	}
</style>
