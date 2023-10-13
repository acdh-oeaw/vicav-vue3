<template>
	<div v-html="htmlContents" class="vv-text" :id="domId"></div>
</template>

<script setup lang="ts">
	import { Ref } from "@vue/runtime-dom"
	import { useWMStore } from '~~/store/wm'

	const htmlContents: Ref<string | undefined> = ref("")
	const props = defineProps(['params'])

	const getText = async () => {
		const { $api } = useNuxtApp()
		const id = String(props.params.id)
		$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
		try {
			return (await $api.vicav.getText({id})).text()
		} catch (error) {
			console.error(error)
		}
	}
	htmlContents.value = await getText()

	const domId = 'id-' + Math.floor(Math.random() * 1000000)
	const wmStore = useWMStore()
	onMounted(() => {
		wmStore.sanitizeLinks(domId)
	})
</script>

<style>
	.vv-text {
		padding: 20px;
	}
</style>
