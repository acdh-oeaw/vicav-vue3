<script lang="ts" setup>
definePageMeta({
	title: "Imprint",
});

const env = useRuntimeConfig();

const redmineId = env.public.NUXT_PUBLIC_REDMINE_ID;

const imprint = await useFetch(String(createImprintUrl(defaultLocale, redmineId)), {
	responseType: "text",
	onResponseError(error) {
		throw createError({ fatal: true, statusCode: error.response.status });
	},
});
</script>

<template>
	<div class="prose mx-auto w-full max-w-3xl py-8">
		<h1>Imprint</h1>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div v-if="imprint.data.value" v-html="imprint.data.value" />
	</div>
</template>
