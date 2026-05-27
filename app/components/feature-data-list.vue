<script setup lang="ts">
import SimpleMetadataDataList from "@/components/simple-metadata-data-list.vue";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";

defineProps<{
	items: Array<simpleTEIMetadata>;
}>();
</script>

<template>
	<SimpleMetadataDataList
		data-type="Feature"
		:items="items"
		:require-tei-availability-for-link="false"
		search-input-id="feature-search"
		:show-audio-availability="false"
		target-type="Feature"
	/>
</template>
