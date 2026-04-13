<script lang="ts" setup>
import type { ColumnDef, Row, Table } from "@tanstack/vue-table";
import { test } from "liqe";
import { Download, Info, type Map } from "lucide-vue-next";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import {
	type FeatureType,
	GeojsonMapSchema,
	type ListMapWindowItem,
	type WindowItem,
} from "@/types/global.ts";

interface Props {
	params: ListMapWindowItem["params"];
}
const props = defineProps<Props>();
const { params } = toRefs(props);

const queryString: Ref<string> = ref(params.value.queryString);

const emit = defineEmits(["updateQueryParam"]);

const GeojsonStore = useGeojsonStore();
const openOrUpdateWindow = useOpenOrUpdateWindow();
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const { isPending } = GeojsonStore.fetchGeojson(url);
const { fetchedData, tables, showAllDetails, featureValueTaxonomy } = storeToRefs(GeojsonStore);
const { buildFeatureTaxonomy } = GeojsonStore;
const { data: projectData } = useProjectInfo();
const { createColumnDefs } = useColumnGeneration();
const { getTraversedAST, parse } = useFilterParser();

const extendedFeatureNames = computed(() => {
	const allFeatureNames = fetchedData.value.get(url)?.properties.column_headings;
	if (allFeatureNames)
		allFeatureNames.find((feature) => feature.country === "Country").category = "country";
	return allFeatureNames;
});
const extendedFeatureCategories = computed(() => {
	const featureCategories = projectData.value!.projectConfig?.staticData?.table?.[1] as Record<
		string,
		string
	>;
	const extendedFeatureCategories = { ...featureCategories, country: "Country" };
	return extendedFeatureCategories;
});

const columns = computed(() => {
	if (extendedFeatureNames.value && extendedFeatureCategories.value)
		return createColumnDefs(extendedFeatureCategories.value, extendedFeatureNames.value);
	else return [];
});
const columnVisibility = computed(() => {
	const columnHeadings = fetchedData.value.get(url)?.properties.column_headings ?? [];
	return {
		...Object.fromEntries(
			columnHeadings?.map((heading) => [
				Object.keys(heading).find((key) => /ft_*/.test(key)),
				false,
			]),
		),
		alternateNames: false,
		country: false,
	};
});

function applyGlobalFilter(row: Row<never>, _colId: string, queryString: string) {
	const hidableVisibleCells = row.getVisibleCells().filter((cell) => cell.column.getCanHide());
	if (hidableVisibleCells.length === 0) return true;
	if (
		hidableVisibleCells.some((cell) => !cell.getValue() || (cell.getValue() as string).length > 0)
	)
		return applyQueryString(row, _colId, queryString);
	return false;
}

function applyQueryString(row: Row<FeatureType>, colId: string, queryString: string) {
	if (!queryString) return true;
	const metadata: Record<string, Array<string>> = {};
	const affectedColumns = getTraversedAST(queryString);
	const preparedRow = Object.fromEntries(
		Object.entries(row.original.properties).map(([key, value]) => {
			if (
				affectedColumns.find((entry) => entry.column === key) &&
				value &&
				typeof value === "object"
			) {
				for (const metadataObjects of Object.values(value)) {
					for (const metadataObject of metadataObjects)
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

	for (const col of Object.keys(preparedRow)) {
		if (!Array.isArray(preparedRow[col])) continue;
		const taxonomyLevels = [
			...new Set(
				(preparedRow[col] as Array<string>).flatMap((val) =>
					featureValueTaxonomy.value.get(`${col}.${val}`)?.taxonomy.split("."),
				),
			),
		];
		if (taxonomyLevels && Array.isArray(taxonomyLevels)) {
			preparedRow[col] = Array.isArray(preparedRow[col])
				? [...preparedRow[col], ...taxonomyLevels]
				: [preparedRow[col], ...taxonomyLevels];
		}
	}

	for (const key in metadata) preparedRow[key] = [...new Set(metadata[key])];

	return test(parse(queryString), preparedRow);
}

const { addDefaultMarker, buildFeatureValueId } = useMarkerStore();
const { markers, markerSettings } = storeToRefs(useMarkerStore());
function onVisibilityChange(props: { table: Table<FeatureType>; col: Record<string, boolean> }) {
	// applyGlobalFilter(props.table);
	const changedColumnKey = Object.keys(props.col)[0]!;
	const visibilityValue = props.col[changedColumnKey]!;
	const hidableVisibleColumns = props.table
		.getVisibleLeafColumns()
		.filter((col) => col.getCanHide());
	if (hidableVisibleColumns.length === 1)
		markerSettings.value.flowerCenterId = hidableVisibleColumns[0]?.id ?? null;
	else markerSettings.value.flowerCenterId = null;
	if (visibilityValue && !markers.value.has(changedColumnKey)) addDefaultMarker(changedColumnKey);
}
function onColumnFilterChange(columnFilters: Array<{ id: string; value: Map<string, unknown> }>) {
	columnFilters.forEach((column) => {
		for (const key of column.value.keys())
			if (!markers.value.has(buildFeatureValueId(column.id, key))) addDefaultMarker(column.id, key);
	});
}
const { parseSearchString, normalizeOperators } = useFilterParser();

const tableRef = ref<Table<FeatureType>>();
function registerTable(table: Table<FeatureType>) {
	buildFeatureTaxonomy(
		projectData.value?.projectConfig?.staticData?.table?.[0] as Record<string, never>,
	);
	if (queryString.value && queryString.value.length > 0) {
		parseSearchString(queryString.value, table as Table<unknown>);
		table.setGlobalFilter(normalizeOperators(queryString.value));
	}

	tables.value.set(url, table);
	triggerRef(tables);
	tableRef.value = table;

	openGeoJsonMap();
}

function openGeoJsonMap() {
	openOrUpdateWindow(
		{
			targetType: "GeojsonMap",
			params: {
				url,
				markerType: "petal",
			},
		} as unknown as WindowItem,
		"Variety Data - Map View",
		GeojsonMapSchema.shape.params,
		"url",
		false,
	);
}

function onRowClick(row: Row<FeatureType>) {
	row.toggleSelected();
}

function updateQueryParams(newFilter: string) {
	queryString.value = newFilter;
	params.value.queryString = queryString.value;
	emit("updateQueryParam", queryString.value);
}

async function downloadTable(separator = ",", multivalueSaparator = ";") {
	const headers = tableRef.value?.getHeaderGroups().slice(-1)[0]?.headers;
	const rows = tableRef.value?.getFilteredRowModel().rows;
	const mappedRows = rows?.map((row) =>
		headers
			?.map((header) => row.getValue(header.column.id))
			.map((val) => (Array.isArray(val) ? val.join(multivalueSaparator) : val)),
	);
	const hiddenElement = document.createElement("a");
	hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURI(
		`${headers!.map((h) => h.column.columnDef.header).join(separator)}\n${mappedRows!.join("\n")}`,
	)}`;
	hiddenElement.target = "_blank";
	hiddenElement.download = `${tableRef.value?.getState().globalFilter}.csv`;
	hiddenElement.style.display = "none";
	document.body.appendChild(hiddenElement);
	hiddenElement.click();
	document.body.removeChild(hiddenElement);
}

function jumpToRow(option: { value: string; label: string }) {
	if (!tableRef.value) return;

	const idx = tableRef.value
		.getFilteredRowModel()
		.rows.findIndex((row) => (row.getValue("name") as string) === option.value);
	if (idx < 0) return;
	const pageSize = tableRef.value.getState().pagination.pageSize;
	const targetPage = Math.floor(idx / pageSize);
	tableRef.value.setPageIndex(targetPage);
	const rowId = tableRef.value.getFilteredRowModel().rows[idx]?.id;
	tableRef.value.setRowSelection({ [rowId!]: true });
}

const searchableLocationNames = computed(() => {
	return (
		tableRef.value
			?.getFilteredRowModel()
			.rows.map((r) => r.getValue("name") as string)
			.map((name) => ({ value: name, label: name })) ?? []
	);
});
</script>

<template>
	<div class="flex h-full min-h-0 flex-col">
		<Centered v-if="isPending">
			<LoadingIndicator />
		</Centered>
		<div class="flex justify-between justify-items-end border-b bg-white py-2">
			<!-- <DataTablePagination v-if="tableRef" :table="tableRef as unknown as Table<never>" /> -->
			<div class="flex px-2">
				<SearchableCombobox
					nothing-found="No matching location found."
					:options="searchableLocationNames"
					placeholder-text="Jump to location"
					search-placeholder="Search location..."
					@select="jumpToRow"
				/>
			</div>
			<div class="flex gap-2">
				<Toggle v-model:model-value="showAllDetails" class="h-8"
					><Info class="size-4 stroke-neutral-800 transition-colors" />
					<span class="line-clamp-1 text-ellipsis">Show details</span></Toggle
				>
				<Button class="inline-flex h-8 gap-2 border-0" variant="outline" @click="downloadTable">
					<Download class="size-4 stroke-neutral-800 transition-colors" />
					<span class="line-clamp-1 text-ellipsis">Export table</span>
				</Button>
			</div>
		</div>
		<div class="min-h-0 flex-1 overflow-auto">
			<DataTable
				v-if="!isPending"
				:column-filter-change-fn="onColumnFilterChange"
				:columns="columns as unknown as Array<ColumnDef<never>>"
				:enable-filter-on-columns="false"
				:global-filter-fn="applyGlobalFilter"
				:initial-column-visibility="columnVisibility"
				:items="fetchedData.get(url)?.features as Array<never>"
				:min-header-depth="2"
				:sticky-header="true"
				:visibility-change-fn="onVisibilityChange"
				@global-filter-change="updateQueryParams"
				@row-click="onRowClick"
				@table-ready="registerTable"
			></DataTable>
		</div>
		<div class="flex items-center justify-between py-2">
			<div class="text-sm">
				<span class="mx-2 font-medium">Total:</span
				><span> {{ tableRef?.getFilteredRowModel().flatRows.length }} rows</span>
			</div>
			<DataTablePagination
				v-if="tableRef"
				open-to-side="top"
				:table="tableRef as unknown as Table<never>"
			/>
		</div>
	</div>
</template>
