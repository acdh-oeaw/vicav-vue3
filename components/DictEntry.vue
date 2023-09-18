<template>
	<div v-html="htmlContents"></div>
</template>

<script setup lang="ts">
	import { Ref } from "@vue/runtime-dom"

	const htmlContents: Ref<string | undefined> = ref("")
	const props = defineProps<{
		params: {
			sid: string,
			dict: string,
		},
	}>()

	const GetDictEntry = async () => {
		const { $api } = useNuxtApp()
		const id = String(props.params.sid)
		const dict = String(props.params.sid)
		$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
		try {
			// TODO: add GetDictEntry to api
			// return (await $api.text.getDictEntry({id, dict})).text()
			return `Error showing dictionary entry for dict=${dict}&id=${id} – api is missing`
		} catch (error) {
			console.error(error)
		}
	}

	htmlContents.value = await GetDictEntry()
</script>
