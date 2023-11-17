<script lang="ts" setup>
interface Props {
	item: WindowItem;
}

const props = defineProps<Props>();
</script>

<template>
	<GeoMapWindowContent v-if="props.item.kind === 'geo-map'" :params="props.item.params" />
	<TextWindowContent v-if="props.item.kind === 'text'" :params="props.item.params" />
	<SpecCharInputDemoWindowContent
		v-if="props.item.kind === 'spec-char-input-demo'"
		:params="props.item.params"
	/>
	<pre v-else>{{ props }}</pre>
</template>
