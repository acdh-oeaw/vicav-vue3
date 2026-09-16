<script lang="ts" setup>
import type { Feature, Point } from "geojson";
import type Zod from "zod";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { GeojsonMapSchema, WindowItem } from "@/types/global.ts";

interface Props {
	params: Zod.infer<typeof GeojsonMapSchema>["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const GeojsonStore = useGeojsonStore();

const labelDisplayMode = ref<"on" | "off" | "default">("default");
const defaultDisplayLabelsZoom = 10;

const filteredMarkers = computed(() => {
	return GeojsonStore.table?.getFilteredRowModel().rows.map((row) => {
		const marker = row.original;
		if (!("label" in marker.properties)) marker.properties.label = marker.properties.name;
		marker.properties.targetType = "Location";
		return marker;
	});
});

const selectedRowCoordinates = computed(() => {
	const selection = GeojsonStore.table?.getSelectedRowModel();
	return (
		selection?.rows.map((r) => r.original.geometry.coordinates as [number, number])[0] ?? undefined
	);
});

const openOrUpdateWindow = useOpenOrUpdateWindow();
function onMarkerClick(feature: Feature) {
	const selection = GeojsonStore.table
		?.getCoreRowModel()
		.flatRows.find((row) => row.original.id === feature.id);
	selection?.toggleSelected(true);
	openOrUpdateWindow(
		{
			targetType: "Location",
			params: selection,
		} as unknown as WindowItem,
		feature.properties?.name as unknown as string,
	);
}
</script>

<template>
	<div class="relative isolate grid size-full grid-rows-[auto_1fr]" data-onboarding="map-container">
		<GeojsonMapToolbar v-if="filteredMarkers" :params="params"></GeojsonMapToolbar>
		<VisualisationContainer
			v-slot="{ width, height }"
			:class="{ 'opacity-50 grayscale': !filteredMarkers }"
		>
			<GeoMap
				v-if="filteredMarkers"
				:default-display-labels-zoom="defaultDisplayLabelsZoom"
				:display-labels="labelDisplayMode"
				:height="height"
				:marker-type="params.markerType"
				:markers="filteredMarkers as Array<Feature<Point, MarkerProperties>>"
				:selection="selectedRowCoordinates"
				:use-custom-click-handler="true"
				:width="width"
				@marker-click="onMarkerClick"
			/>
			<Centered v-if="!filteredMarkers">
				<LoadingIndicator />
			</Centered>
			<GeojsonMapLegend
				v-if="filteredMarkers"
				class="absolute bottom-2 left-2 max-h-[50%] rounded-md shadow-lg"
				:params="params"
			></GeojsonMapLegend>
			<GeojsonMapControls
				class="absolute top-2 left-2"
				:display-labels="labelDisplayMode"
				@update:display-labels="labelDisplayMode = $event"
			></GeojsonMapControls>
		</VisualisationContainer>
	</div>
</template>
