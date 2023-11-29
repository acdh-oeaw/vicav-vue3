<script lang="ts" setup>
interface Props {
	item: WindowItem;
}

const props = defineProps<Props>();
</script>

<template>
	<GeoMapWindowContent v-if="props.item.kind === 'geo-map'" :params="props.item.params" />
	<TextWindowContent v-else-if="props.item.kind === 'text'" :params="props.item.params" />
	<pre v-else>{{ props }}</pre>
</template>
