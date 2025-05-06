<script lang="ts" setup>
import type { ColumnDef, Row, Table } from "@tanstack/vue-table";
import { parse, test } from "liqe";
import { Info } from "lucide-vue-next";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { FeatureType, MarkerType } from "@/types/global";

const GeojsonStore = useGeojsonStore();
const { addWindow, findWindowByTypeAndParam } = useWindowsStore();
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const { isPending } = GeojsonStore.fetchGeojson(url);
const { fetchedData, tables, showAllDetails } = storeToRefs(GeojsonStore);
const { data: projectData } = useProjectInfo();
const { createColumnDefs } = useColumnGeneration();

const columns = computed(() => {
	const allFeatureNames = fetchedData.value.get(url)?.properties.column_headings;

	const featureCategories = projectData.value!.projectConfig?.staticData?.table?.[1] as Record<
		string,
		string
	>;

	if (allFeatureNames && featureCategories)
		return createColumnDefs(featureCategories, allFeatureNames);
	else return [];
});
const columnVisibility = computed(() => {
	const columnHeadings = fetchedData.value.get(url)?.properties.column_headings ?? [];
	return Object.fromEntries(
		columnHeadings?.map((heading) => [Object.keys(heading).find((key) => /ft_*/.test(key)), false]),
	);
});

function applyGlobalFilter(row: Row<FeatureType>, _colId: string, queryString: string) {
	const hidableVisibleCells = row.getVisibleCells().filter((cell) => cell.column.getCanHide());
	if (hidableVisibleCells.length === 0) return true;
	if (
		hidableVisibleCells.some((cell) => !cell.getValue() || (cell.getValue() as string).length > 0)
	)
		return applyQueryString(row, _colId, queryString);
	return false;
}

function applyQueryString(row: Row<FeatureType>, _colId: string, queryString: string) {
	if (!queryString) return true;
	const metadata: Record<string, Array<string>> = {};
	const preparedRow = Object.fromEntries(
		Object.entries(row.original.properties).map(([key, value]) => {
			if (value && typeof value === "object") {
				for (const metadataObject of Object.values(value)) {
					for (const metaKey in metadataObject) {
						if (!(metaKey in metadata)) metadata[metaKey] = [];
						metadata[metaKey] = metadata[metaKey]!.concat(metadataObject[metaKey]);
					}
				}
				return [key, Object.keys(value)];
			}
			return [key, value];
		}),
	);
	for (const key in metadata) preparedRow[key] = [...new Set(metadata[key])];
	return test(parse(queryString), preparedRow);
}

const { addColor, addColorVariant, buildFeatureValueId } = useColorsStore();
const { colors } = storeToRefs(useColorsStore());
function onVisibilityChange(props: { table: Table<FeatureType>; col: Record<string, boolean> }) {
	// applyGlobalFilter(props.table);
	const changedColumnKey = Object.keys(props.col)[0]!;
	const visibilityValue = props.col[changedColumnKey]!;
	if (visibilityValue && !colors.value.has(changedColumnKey)) addColor(changedColumnKey);
}
function onColumnFilterChange(columnFilters: Array<{ id: string; value: Map<string, unknown> }>) {
	columnFilters.forEach((column) => {
		for (const key of column.value.keys())
			if (!colors.value.has(buildFeatureValueId(column.id, key))) addColorVariant(column.id, key);
	});
}

const tableRef = ref<Table<FeatureType>>();
function registerTable(table: Table<FeatureType>) {
	tables.value.set(url, table);
	tableRef.value = table;
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
				markerType: "petal" as MarkerType,
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
		<div class="flex justify-between justify-items-end py-2">
			<DataTablePagination v-if="tableRef" :table="tableRef as unknown as Table<never>" />

			<div class="flex gap-2">
				<Toggle v-model:model-value="showAllDetails" class="h-8"
					><Info class="size-4 stroke-neutral-800 transition-colors" />
					<span class="text-ellipsis line-clamp-1">Show all details</span></Toggle
				>
				<DataTableActiveFilters
					v-if="tableRef"
					class="inline"
					:table="tableRef as unknown as Table<never>"
				></DataTableActiveFilters>
				<DataTableFilterColumns
					v-if="tableRef"
					class="inline"
					:table="tableRef as unknown as Table<never>"
				/>
			</div>
		</div>
		<DataTable
			v-if="!isPending"
			:column-filter-change-fn="onColumnFilterChange"
			:columns="columns as unknown as Array<ColumnDef<never>>"
			:enable-filter-on-columns="true"
			:global-filter-fn="applyGlobalFilter"
			:initial-column-visibility="columnVisibility"
			:items="fetchedData.get(url)?.features as Array<never>"
			:min-header-depth="2"
			:visibility-change-fn="onVisibilityChange"
			@table-ready="registerTable"
		></DataTable>
		<div class="grid justify-items-end py-2">
			<DataTablePagination v-if="tableRef" :table="tableRef as unknown as Table<never>" />
		</div>
	</div>
</template>
