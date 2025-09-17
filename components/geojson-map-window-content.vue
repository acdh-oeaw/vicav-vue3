<script lang="ts" setup>
import type { Feature, Point } from "geojson";
import type Zod from "zod";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { GeojsonMapSchema, WindowItem } from "@/types/global.d";

interface Props {
	params: Zod.infer<typeof GeojsonMapSchema>["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const GeojsonStore = useGeojsonStore();

const { tables } = storeToRefs(GeojsonStore);

const filteredMarkers = computed(() => {
	return tables.value
		.get(params.value.url)
		?.getFilteredRowModel()
		.rows.map((row) => {
			const marker = row.original;
			if (!("label" in marker.properties)) marker.properties.label = marker.properties.name;
			marker.properties.targetType = "Location";
			return marker;
		});
});

const selectedRowCoordinates = computed(() => {
	const selection = tables.value.get(params.value.url)?.getSelectedRowModel();
	return (
		selection?.rows.map((r) => r.original.geometry.coordinates as [number, number])[0] ?? undefined
	);
});

const openOrUpdateWindow = useOpenOrUpdateWindow();
function onMarkerClick(feature: Feature) {
	const selection = tables.value
		.get(params.value.url)
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
	<div class="relative isolate grid size-full grid-rows-[auto_1fr]">
		<GeojsonMapToolbar v-if="filteredMarkers" :params="params"></GeojsonMapToolbar>
		<VisualisationContainer
			v-slot="{ width, height }"
			:class="{ 'opacity-50 grayscale': !filteredMarkers }"
		>
			<GeoMap
				v-if="filteredMarkers"
				:display-labels="10"
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
				class="absolute bottom-0 left-0"
				:params="params"
			></GeojsonMapLegend>
			<GeojsonMapControls class="absolute top-0 left-0"></GeojsonMapControls>
		</VisualisationContainer>
	</div>
</template>
