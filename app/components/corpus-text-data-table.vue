<script setup lang="ts">
import {
	type ColumnDef,
	createColumnHelper,
	type Row,
	type Table as TanstackTable,
} from "@tanstack/vue-table";
import { Volume2, VolumeX } from "lucide-vue-next";
import { h } from "vue";

import {
	getSimpleMetadataValue,
	type SimpleMetadataAccessorKey,
	simpleMetadataAccessors,
} from "@/stores/use-tei-headers-store.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";
import { matchesFilterValueMap } from "@/utils/filter-value-map.ts";

const props = defineProps<{
	items: Array<simpleTEIMetadata>;
}>();

const openNewWindowFromAnchor = useAnchorClickHandler();
const tableRef = ref<TanstackTable<simpleTEIMetadata> | null>(null);
const globalFilter = ref("");
const columnHelper = createColumnHelper<simpleTEIMetadata>();
const labelCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function compareStringValues(a: unknown, b: unknown): number {
	return labelCollator.compare(String(a ?? ""), String(b ?? ""));
}

function facetedStringFilter(row: Row<simpleTEIMetadata>, columnId: string, filterValue: unknown) {
	return matchesFilterValueMap(row.getValue(columnId), filterValue);
}

function applyGlobalFilter(row: Row<simpleTEIMetadata>, _columnId: string, filterValue: string) {
	if (!filterValue) return true;

	const query = filterValue.toLocaleLowerCase();
	const searchableKeys: Array<SimpleMetadataAccessorKey> = [
		"label",
		"category",
		"recordingDate",
		"duration",
		"audioAvailability",
		"@hasTEIw",
		"country",
		"region",
		"settlement",
	];
	const searchableValues = searchableKeys.map((key) => getSimpleMetadataValue(row.original, key));

	return searchableValues.some((value) => value.toLocaleLowerCase().includes(query));
}

function createTextColumn(key: keyof typeof simpleMetadataAccessors) {
	const accessor = simpleMetadataAccessors[key];

	return columnHelper.accessor((row) => getSimpleMetadataValue(row, key), {
		id: key,
		header: accessor.label,
		cell: (info) => info.getValue(),
		filterFn: facetedStringFilter,
		sortingFn: (rowA, rowB, columnId) =>
			compareStringValues(rowA.getValue(columnId), rowB.getValue(columnId)),
		enableColumnFilter: accessor.filterable ?? false,
		enableGrouping: "groupable" in accessor ? accessor.groupable : false,
		enableSorting: accessor.sortable ?? false,
	});
}

const columns = computed(() => {
	return [
		createTextColumn("country"),
		createTextColumn("region"),
		createTextColumn("settlement"),
		columnHelper.accessor((row) => getSimpleMetadataValue(row, "label"), {
			id: "label",
			header: simpleMetadataAccessors.label.label,
			cell: (info) => {
				const item = info.row.original;
				if (item["@hasTEIw"] !== "true") return item.label;

				return h(
					"a",
					{
						class: "text-primary underline",
						"data-target-type": "CorpusText",
						"data-text-id": item.id,
						href: "#",
					},
					item.label,
				);
			},
			sortingFn: (rowA, rowB, columnId) =>
				compareStringValues(rowA.getValue(columnId), rowB.getValue(columnId)),
			enableColumnFilter: true,
			enableGrouping: false,
			enableSorting: true,
		}),
		createTextColumn("category"),
		createTextColumn("recordingDate"),
		createTextColumn("duration"),
		columnHelper.accessor((row) => getSimpleMetadataValue(row, "audioAvailability"), {
			id: "audioAvailability",
			header: simpleMetadataAccessors.audioAvailability.label,
			cell: (info) =>
				info.getValue() === "free"
					? h(Volume2, { class: "size-5", title: "Audio recording is publicly available" })
					: h(VolumeX, { class: "size-5", title: "Audio recording is restricted" }),
			filterFn: facetedStringFilter,
			sortingFn: (rowA, rowB, columnId) =>
				compareStringValues(rowA.getValue(columnId), rowB.getValue(columnId)),
			enableColumnFilter: true,
			enableSorting: true,
		}),
		columnHelper.accessor((row) => getSimpleMetadataValue(row, "@hasTEIw"), {
			id: "@hasTEIw",
			header: simpleMetadataAccessors["@hasTEIw"].label,
			cell: (info) => (info.getValue() === "true" ? "available" : "unavailable"),
			filterFn: facetedStringFilter,
			sortingFn: (rowA, rowB, columnId) =>
				compareStringValues(rowA.getValue(columnId), rowB.getValue(columnId)),
			enableColumnFilter: true,
			enableSorting: true,
		}),
	];
});

const items = computed(() => props.items.filter((item) => item.dataType === "CorpusText"));
const facetColumnIds = [
	"country",
	"region",
	"settlement",
	"category",
	"audioAvailability",
	"@hasTEIw",
];

function registerTable(table: TanstackTable<simpleTEIMetadata>) {
	tableRef.value = table;
}

watch(globalFilter, (value) => {
	tableRef.value?.setGlobalFilter(value);
});
</script>

<template>
	<div class="grid size-full grid-rows-[auto_1fr_auto] overflow-hidden">
		<div class="flex flex-wrap items-center justify-between gap-2 p-2">
			<DataTablePagination v-if="tableRef" :table="tableRef as unknown as TanstackTable<never>" />

			<div class="flex flex-wrap items-center justify-end gap-2">
				<label class="text-sm font-medium whitespace-nowrap" for="corpus-text-search"
					>Search:</label
				>
				<input
					id="corpus-text-search"
					v-model="globalFilter"
					class="h-8 w-56 rounded-md border border-input px-2"
					type="search"
				/>
				<DataTableActiveFilters
					v-if="tableRef"
					:table="tableRef as unknown as TanstackTable<never>"
				/>
				<div v-if="tableRef" class="flex flex-wrap items-center gap-1">
					<span
						v-for="columnId in facetColumnIds"
						:key="columnId"
						class="inline-flex items-center gap-1 text-sm"
					>
						<span>{{ tableRef.getColumn(columnId)?.columnDef.header }}</span>
						<DataTableFacetedFilter
							v-if="tableRef.getColumn(columnId)"
							:column="tableRef.getColumn(columnId)!"
						/>
					</span>
				</div>
				<div class="text-sm">
					{{ tableRef?.getFilteredRowModel().flatRows.length ?? 0 }} results
				</div>
			</div>
		</div>
		<div class="overflow-auto">
			<DataTable
				:columns="columns as unknown as Array<ColumnDef<never>>"
				:enable-filter-on-columns="false"
				:enable-grouping="true"
				:enable-sorting="true"
				:global-filter-fn="applyGlobalFilter"
				:initial-column-visibility="{ country: false, region: false, settlement: false }"
				:initial-expanded="true"
				:initial-grouping="['country', 'region', 'settlement']"
				:initial-sorting="[{ id: 'label', desc: false }]"
				:items="items as Array<never>"
				@click="openNewWindowFromAnchor"
				@table-ready="registerTable"
			/>
		</div>
		<div class="grid justify-items-end p-2">
			<DataTablePagination v-if="tableRef" :table="tableRef as unknown as TanstackTable<never>" />
		</div>
	</div>
</template>
