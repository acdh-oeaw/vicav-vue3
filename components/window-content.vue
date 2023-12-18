<script lang="ts" setup>
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
	<GeoMapWindowContent v-if="props.item.kind === 'geo-map'" :params="props.item.params" />
	<TextWindowContent v-else-if="props.item.kind === 'text'" :params="props.item.params" />
	<ProfileWindowContent v-else-if="props.item.kind === 'profile'" :params="props.item.params" />
	<FeatureWindowContent v-else-if="props.item.kind === 'feature'" :params="props.item.params" />
	<BiblioEntriesWindowContent
		v-else-if="props.item.kind === 'bibliography-entries'"
		:params="props.item.params"
		@update-query-param="updateQueryParam"
	/>
	<pre v-else>{{ props }}</pre>
</template>
