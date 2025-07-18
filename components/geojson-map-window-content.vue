<script lang="ts" setup>
import type { Feature, Point } from "geojson";
import type { z } from "zod";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { GeojsonMapSchema } from "@/types/global.d";

interface Props {
	params: z.infer<typeof GeojsonMapSchema>["params"];
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
			return row.original;
		});
});

const selectedRowCoordinates = computed(() => {
	const selection = tables.value.get(params.value.url)?.getSelectedRowModel();
	return (
		selection?.rows.map((r) => r.original.geometry.coordinates as [number, number])[0] ?? undefined
	);
});
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
				:width="width"
			/>
			<Centered v-if="!filteredMarkers">
				<LoadingIndicator />
			</Centered>
			<GeojsonMapLegend
				v-if="filteredMarkers"
				class="absolute bottom-0 left-0"
				:params="params"
			></GeojsonMapLegend>
		</VisualisationContainer>
	</div>
</template>
