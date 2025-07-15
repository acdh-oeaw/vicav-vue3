<script setup lang="ts">
import { noop } from "@acdh-oeaw/lib";

definePageMeta({
	title: "Status",
	layout: "plain",
});

const { data, suspense } = useProjectInfo();
// copied from layouts/default.vue
// without this the server does not wait for the data to be ready before
// returning the rendered page.
// TODO: find a better way to do this when using useProjectInfo
onServerPrefetch(async () => {
	/**
	 * @see https://github.com/TanStack/query/issues/6606
	 * @see https://github.com/TanStack/query/issues/5976
	 */
	await suspense().catch(noop);
});

const env = useRuntimeConfig();
</script>

<template>
	<pre>
Backend response:
{{ "  " }}ETag: {{ data?.ETag ?? "" }}
{{ "  " }}baseURIPublic: {{ data?.projectConfig?.baseURIPublic ?? "" }}
{{ "  " }}took: {{ data?.took ?? "" }}
{{ "  " }}version: {{ data?.projectConfig?.version?.backend ?? "" }}
Frontend:
{{ "  " }}version: {{ env.public.currentGitSha ?? "" }}
	</pre
	>
</template>

<style>
#__nuxt {
	overflow: scroll;
	block-size: 100%;
}
</style>
