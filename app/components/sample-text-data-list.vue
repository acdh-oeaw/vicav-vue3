<script setup lang="ts">
import SimpleMetadataDataList from "@/components/simple-metadata-data-list.vue";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";

defineProps<{
	items: Array<simpleTEIMetadata>;
}>();
</script>

<template>
	<SimpleMetadataDataList
		data-type="SampleText"
		:items="items"
		:require-tei-availability-for-link="false"
		search-input-id="sample-text-search"
		:show-audio-availability="true"
		target-type="SampleText"
	/>
</template>
