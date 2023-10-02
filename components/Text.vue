<template>
	<div v-html="htmlContents" class="vv-text" :id="domId"></div>
</template>

<script setup lang="ts">
	import { Ref } from "@vue/runtime-dom"

	const htmlContents: Ref<string | undefined> = ref("")
	const props = defineProps(['params'])

	const domId = 'id-' + Math.floor(Math.random() * 1000000)

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

	const SanitizeLinks = () => {
		document.querySelectorAll(`#${domId} .aVicText`)
		.forEach(a => {
			let targetType = a.getAttribute('data-target-type'),
				textId = a.getAttribute('data-text-id')
			console.log('Link', targetType, textId)
			if (targetType == 'external-link') {
				return
			}
			a.addEventListener("click", e => {
				e.preventDefault()
				console.log(`You clicked a link, target-type: ${targetType}, text-id: ${textId}`)
			}, false)
		})
	}

	htmlContents.value = await GetText()
	onMounted(() => {
		SanitizeLinks()
	})
</script>

<style>
	.vv-text {
		padding: 20px;
	}
</style>
