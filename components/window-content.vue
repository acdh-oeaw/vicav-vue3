<script lang="ts" setup>
interface Props {
	item: WindowItem;
}

const props = defineProps<Props>();
</script>

<template>
	<GeoMapWindowContent v-if="props.item.kind === 'geo-map'" :params="props.item.params" />
	<TextWindowContent v-else-if="props.item.kind === 'text'" :params="props.item.params" />
	<ProfileWindowContent v-else-if="props.item.kind === 'profile'" :params="props.item.params" />
	<FeatureWindowContent v-else-if="props.item.kind === 'feature'" :params="props.item.params" />
	<pre v-else>{{ props }}</pre>
</template>
