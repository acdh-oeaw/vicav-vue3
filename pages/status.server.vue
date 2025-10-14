<script setup lang="ts">
definePageMeta({
	title: "Status",
	layout: "plain",
});

const { data } = useProjectInfo();
</script>

<template>
	<pre>
Backend response:
ETag: {{ data?.ETag ?? "" }}
baseURIPublic: {{ data?.projectConfig?.baseURIPublic ?? "" }}
took: {{ data?.took ?? "" }}
	</pre
	>
</template>

<style>
#__nuxt {
	overflow: scroll;
	block-size: 100%;
}
</style>
