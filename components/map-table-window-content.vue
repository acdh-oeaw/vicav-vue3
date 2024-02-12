<script lang="ts" setup>
import { useWibarabGeojson } from "@/composables/use-wibarab-geojson.ts";

const { data, isPending, isPlaceholderData } = useWibarabGeojson();

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
</script>

<template>
	<VisualisationContainer v-slot="{ width, height }" :class="{ 'opacity-50 grayscale': isLoading }">
		<GeoMap v-if="!isLoading" :height="height" :markers="data.features" :width="width" />
		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</VisualisationContainer>
</template>
