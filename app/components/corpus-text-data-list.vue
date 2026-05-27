<script setup lang="ts">
import SimpleMetadataDataList from "@/components/simple-metadata-data-list.vue";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";

defineProps<{
	items: Array<simpleTEIMetadata>;
}>();
</script>

<template>
	<SimpleMetadataDataList
		data-type="CorpusText"
		:items="items"
		:require-tei-availability-for-link="true"
		search-input-id="corpus-text-search"
		:show-audio-availability="true"
		target-type="CorpusText"
	/>
</template>
