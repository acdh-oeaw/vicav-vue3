<script lang="ts" setup>
import type { CellContext, ColumnDef, Table } from "@tanstack/vue-table";

import { useGeojson } from "@/composables/use-geojson.ts";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { FeatureType } from "@/types/global.d.ts";

const { data, isPending } = useGeojson();

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);

const { addWindow, findWindowByTypeAndParam } = useWindowsStore();

const columns = computed(() => {
	if (data.value && data.value[0])
		return data.value[0].properties.column_headings.map((heading: Record<string, never>) => {
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
	return [];
});

function registerTable(table: Table<FeatureType>) {
	tables.value.set("0", table);
	const mw = findWindowByTypeAndParam("GeojsonMap", "url", "0");
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
				url: "0",
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
		<div class="sticky top-0 z-10">
			<div v-if="tables.get('0')" class="grid justify-items-end bg-white py-2">
				<DataTablePagination :table="tables.get('0') as unknown as Table<never>" />
			</div>
			<TableHeader class="bg-primary font-bold text-on-primary">
				<TableRow v-for="headerGroup in tables.get('0')!.getHeaderGroups()" :key="headerGroup.id">
					<TableHead v-for="header in headerGroup.headers" :key="header.id">
						{{ header.column.columnDef.header }}
					</TableHead>
				</TableRow>
			</TableHeader>
		</div>
		<DataTable
			v-if="!isPending && data && data[0]"
			:columns="columns as unknown as Array<ColumnDef<never>>"
			:header="false"
			:items="data[0].features as Array<never>"
			@table-ready="registerTable"
		></DataTable>
		<div class="grid justify-items-end py-2">
			<DataTablePagination
				v-if="tables.get('0')"
				:table="tables.get('0') as unknown as Table<never>"
			/>
		</div>
	</div>
</template>
