<script lang="ts" setup>
import type { Table } from "@tanstack/vue-table";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { FeatureType } from "@/types/global";

const GeojsonStore = useGeojsonStore();
const WindowStore = useWindowsStore();
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const { isPending } = GeojsonStore.fetchGeojson(url);
const { fetchedData, tables } = storeToRefs(GeojsonStore);

const columns = computed(() => {
	return fetchedData.value.get(url)?.properties.column_headings.map((heading: string) => {
		return {
			id: Object.keys(heading)[0],
			header: Object.values(heading)[0],
		};
	});
});

function registerTable(table: Table<FeatureType>) {
	tables.value.set(url, table);
	WindowStore.addWindow({
		targetType: "GeojsonMap",
		params: {
			url,
		},
		title: "Variety Data - Map View",
	});
}
</script>

<template>
	<Centered v-if="isPending">
		<LoadingIndicator />
	</Centered>
	<DataTable
		v-if="!isPending"
		:items="fetchedData.get(url)?.features"
		:columns="columns"
		@table-ready="registerTable"
	></DataTable>
</template>
