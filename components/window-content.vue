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
	<GeoMapWindowContent
		v-if="props.item.targetType === 'WMap'"
		:params="props.item.params"
		:title="props.item.winbox.title"
	/>
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
	<FeatureValueWindowContent
		v-else-if="props.item.targetType === 'FeatureValue'"
		:params="props.item.params"
	/>
	<LocationWindowContent
		v-else-if="props.item.targetType === 'Location'"
		:params="props.item.params"
	/>
	<BiblioEntriesWindowContent
		v-else-if="props.item.targetType === 'BiblioEntries'"
		:params="props.item.params"
		@update-query-param="updateQueryParam"
	/>
	<DictQueryWindowContent
		v-else-if="props.item.targetType === 'DictQuery'"
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
	<CorpusTextJsonWindowContent
		v-else-if="props.item.targetType === 'CorpusText'"
		:params="props.item.params"
	/>
	<DataListWindowContent
		v-else-if="props.item.targetType === 'DataList'"
		:params="props.item.params"
	/>

	<DataTableWindowContent
		v-else-if="props.item.targetType === 'DataTable'"
		:params="props.item.params"
	/>

	<ExploreSamplesFormWindowContent
		v-else-if="props.item.targetType === 'ExploreSamplesForm'"
		:params="props.item.params"
	/>

	<ExploreSamplesWindowContent
		v-else-if="props.item.targetType === 'ExploreSamples'"
		:params="props.item.params"
	/>
	<pre v-else>{{ props }}</pre>
</template>
