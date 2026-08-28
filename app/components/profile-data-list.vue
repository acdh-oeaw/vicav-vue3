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
}>();
</script>

<template>
	<SimpleMetadataDataList
		data-type="Profile"
		:items="items"
		:list-state="listState"
		:require-tei-availability-for-link="false"
		search-input-id="profile-search"
		:show-audio-availability="false"
		target-type="Profile"
		@update:list-state="$emit('update:listState', $event)"
	/>
</template>
