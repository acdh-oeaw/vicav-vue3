<script setup lang="ts">
import SimpleMetadataDataList from "@/components/simple-metadata-data-list.vue";
import type { SimpleMetadataListState } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";

defineProps<{
	items: Array<simpleTEIMetadata>;
	listState?: SimpleMetadataListState;
}>();

defineEmits<{
	"update:listState": [listState: SimpleMetadataListState | undefined];
	"update:visibleItems": [items: Array<simpleTEIMetadata>];
}>();
</script>

<template>
	<SimpleMetadataDataList
		data-type="SampleText"
		:items="items"
		:list-state="listState"
		:require-tei-availability-for-link="false"
		search-input-id="sample-text-search"
		:show-audio-availability="true"
		target-type="SampleText"
		@update:list-state="$emit('update:listState', $event)"
		@update:visible-items="$emit('update:visibleItems', $event)"
	/>
</template>
