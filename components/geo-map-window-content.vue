<script lang="ts" setup>
interface Props {
	params: GeoMapWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isFetching } = useGeoMarkers(params);

const markers = computed(() => {
	return data.value ?? [];
});
</script>

<template>
	<VisualisationContainer
		v-slot="{ width, height }"
		:class="{ 'opacity-50 grayscale': isFetching }"
	>
		<GeoMap :height="height" :markers="markers" :width="width" />

		<Centered v-if="isFetching">
			<LoadingIndicator />
		</Centered>
	</VisualisationContainer>
</template>
