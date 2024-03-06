<script lang="ts" setup>
import type { Table } from "@tanstack/vue-table";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { FeatureType } from "@/types/global";

const GeojsonStore = useGeojsonStore();
const { addWindow, findWindowByTypeAndParam } = useWindowsStore();
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";
const featureDefUrl = "https://wibarab-api.acdh-ch-dev.oeaw.ac.at/vicav/featurelist.json";

const { isFeatureDefPending } = GeojsonStore.fetchColumnDefinitions(url, featureDefUrl);
const { isPending } = GeojsonStore.fetchGeojson(url);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { fetchedData, tables, columnDefs } = storeToRefs(GeojsonStore);

const columns = computed(() => {
	return fetchedData.value.get(url)?.properties.column_headings.map((heading: string) => {
		switch (true) {
			case /ft_*/.test(Object.keys(heading)[0]):
				return {
					id: Object.keys(heading)[0],
					header: Object.values(heading)[0],
					cell: ({ cell }) => {
						return h(resolveComponent("GeojsonTablePropertyCell"), {
							value: cell.row.original.properties[cell.column.columnDef.id],
						});
					},
				};
			case /name/.test(Object.keys(heading)[0]):
				return {
					id: Object.keys(heading)[0],
					header: Object.values(heading)[0],
					cell: ({ cell }) => {
						return h(
							"span",
							{ class: "max-w-[500px] truncate font-medium" },
							cell.row.original.properties[cell.column.columnDef.id],
						);
					},
				};
			default:
				return {
					id: Object.keys(heading)[0],
					header: Object.values(heading)[0],
					cell: ({ cell }) => {
						return h(
							"span",
							{ class: "max-w-[500px] truncate font-medium" },
							cell.row.original.properties[cell.column.columnDef.id],
						);
					},
				};
		}
	});
});

function registerTable(table: Table<FeatureType>) {
	tables.value.set(url, table);
	const fw = findWindowByTypeAndParam("GeojsonFilter", "url", url);
	if (fw) {
		fw.winbox.focus();
		fw.winbox.addClass("highlighted");
		setTimeout(() => {
			fw.winbox.removeClass("highlighted");
		}, 1000);
	} else {
		addWindow({
			targetType: "GeojsonFilter",
			params: {
				url,
			},
			title: "Variety Data - Filter Data",
		});
	}
	const mw = findWindowByTypeAndParam("GeojsonMap", "url", url);
	if (mw) {
		mw.winbox.focus();
		mw.winbox.addClass("highlighted");
		setTimeout(() => {
			mw.winbox.removeClass("highlighted");
		}, 1000);
	} else {
		addWindow({
			targetType: "GeojsonMap",
			params: {
				url,
			},
			title: "Variety Data - Map View",
		});
	}
}
</script>

<template>
	<div class="absolute">
		<Centered v-if="isPending && isFeatureDefPending">
			<LoadingIndicator />
		</Centered>
		<div class="sticky left-1 top-0 z-10 grid justify-items-start bg-accent py-2">
			<DataTablePagination v-if="tables.get(url)" :table="tables.get(url)" />
		</div>
		<DataTable
			v-if="!isPending && !isFeatureDefPending"
			:items="fetchedData.get(url)?.features"
			:columns="columns"
			@table-ready="registerTable"
		></DataTable>
	</div>
</template>
