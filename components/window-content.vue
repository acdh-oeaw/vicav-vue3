<script lang="ts" setup>
import type { WindowItem } from "@/types/global.d";

interface Props {
	item: WindowItem;
}

const windowsStore = useWindowsStore();

const props = defineProps<Props>();

function updateQueryParam(queryString: string) {
	windowsStore.updateQueryParam(props.item.id, queryString);
}
</script>

<template>
	<GeoMapWindowContent v-if="props.item.targetType === 'WMap'" :params="props.item.params" />
	<TextWindowContent v-else-if="props.item.targetType === 'Text'" :params="props.item.params" />
	<SampleTextWindowContent
		v-else-if="props.item.targetType === 'SampleText'"
		:params="props.item.params"
	/>
	<ProfileWindowContent
		v-else-if="props.item.targetType === 'Profile'"
		:params="props.item.params"
	/>
	<FeatureWindowContent
		v-else-if="props.item.targetType === 'Feature'"
		:params="props.item.params"
	/>
	<BiblioEntriesWindowContent
		v-else-if="props.item.targetType === 'BiblioEntries'"
		:params="props.item.params"
		@update-query-param="updateQueryParam"
	/>
	<GeojsonTableWindowContent
		v-else-if="props.item.targetType === 'ListMap'"
		:params="props.item.params"
	/>
	<GeojsonMapWindowContent
		v-else-if="props.item.targetType === 'GeojsonMap'"
		:params="props.item.params"
	/>
	<CorpusQueryWindowContent
		v-else-if="props.item.targetType === 'CorpusQuery'"
		:params="props.item.params"
	/>
	<CorpusTextWindowContent
		v-else-if="props.item.targetType === 'CorpusText'"
		:params="props.item.params"
	/>
	<pre v-else>{{ props }}</pre>
</template>
