<template>
	<div v-html="htmlContents"></div>
</template>

<script setup lang="ts">
	import { Ref } from "@vue/runtime-dom"

	const htmlContents: Ref<string | undefined> = ref("")
	const props = defineProps(['params'])

	const GetText = async () => {
		const { $api } = useNuxtApp()
		const id = String(props.params.id)
		$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
		try {
			return (await $api.vicav.getText({id})).text()
		} catch (error) {
			console.error(error)
		}
	}

	htmlContents.value = await GetText()
</script>
