<script lang="ts" setup>
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { GeojsonMapSchema } from "@/types/global.d";

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
			return row.original;
		});
});
</script>

<template>
	<VisualisationContainer
		v-slot="{ width, height }"
		:class="{ 'opacity-50 grayscale': !filteredMarkers }"
	>
		<GeoMap v-if="filteredMarkers" :height="height" :markers="filteredMarkers" :width="width" />
		<Centered v-if="!filteredMarkers">
			<LoadingIndicator />
		</Centered>
	</VisualisationContainer>
</template>
