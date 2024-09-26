<script lang="ts" setup>
import type { CellContext, ColumnDef, Table } from "@tanstack/vue-table";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { FeatureType } from "@/types/global";

const GeojsonStore = useGeojsonStore();
const { addWindow, findWindowByTypeAndParam } = useWindowsStore();
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const { isPending } = GeojsonStore.fetchGeojson(url);
const { fetchedData, tables } = storeToRefs(GeojsonStore);

const columns = computed(() => {
	return fetchedData.value
		.get(url)
		?.properties.column_headings.map((heading: Record<string, never>) => {
			switch (true) {
				case Object.keys(heading).some((key) => /ft_*/.test(key)):
					return {
						id: Object.keys(heading).find((key) => /ft_*/.test(key)) ?? "",
						header: heading[Object.keys(heading).find((key) => /ft_*/.test(key)) ?? ""],
						cell: ({ cell }: CellContext<FeatureType, never>) => {
							return h(resolveComponent("GeojsonTablePropertyCell"), {
								value: cell.row.original.properties[cell.column.columnDef.id!],
							});
						},
					};
				case /name/.test(Object.keys(heading)[0]!):
					return {
						id: Object.keys(heading)[0],
						header: Object.values(heading)[0],
						cell: ({ cell }: CellContext<FeatureType, never>) => {
							return h(
								"span",
								{ class: "max-w-[500px] truncate font-medium" },
								cell.row.original.properties[cell.column.columnDef.id!],
							);
						},
					};
				default:
					return {
						id: Object.keys(heading)[0],
						header: Object.values(heading)[0],
						cell: ({ cell }: CellContext<FeatureType, never>) => {
							return h(
								"span",
								{ class: "max-w-[500px] truncate font-medium" },
								cell.row.original.properties[cell.column.columnDef.id!],
							);
						},
					};
			}
		});
});

function registerTable(table: Table<FeatureType>) {
	tables.value.set(url, table);
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
	<div>
		<Centered v-if="isPending">
			<LoadingIndicator />
		</Centered>
		<div class="grid justify-items-end py-2">
			<DataTablePagination
				v-if="tables.get(url)"
				:table="tables.get(url) as unknown as Table<never>"
			/>
		</div>
		<DataTable
			v-if="!isPending"
			:columns="columns as unknown as Array<ColumnDef<never>>"
			:items="fetchedData.get(url)?.features as Array<never>"
			@table-ready="registerTable"
		></DataTable>
		<div class="grid justify-items-end py-2">
			<DataTablePagination
				v-if="tables.get(url)"
				:table="tables.get(url) as unknown as Table<never>"
			/>
		</div>
	</div>
</template>
