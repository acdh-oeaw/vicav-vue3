<script setup lang="ts">
import {
	type ColumnFiltersState,
	createColumnHelper,
	type ExpandedState,
	type FilterFn,
	getCoreRowModel,
	getExpandedRowModel,
	getFacetedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	type GroupingState,
	type Row,
	type SortingState,
	type Table as TanstackTable,
	useVueTable,
} from "@tanstack/vue-table";
import { ChevronDown, ChevronRight, Volume2, VolumeX } from "lucide-vue-next";

import {
	getSimpleMetadataValue,
	type SimpleMetadataAccessorKey,
	simpleMetadataAccessors,
} from "@/stores/use-tei-headers-store.ts";
import type { DataTypesEnum } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";
import customFacetedUniqueValues from "@/utils/customFacetedUniqueValues.ts";
import { matchesFilterValueMap } from "@/utils/filter-value-map.ts";

const props = defineProps<{
	items: Array<simpleTEIMetadata>;
	dataType: Extract<DataTypesEnum, "CorpusText" | "SampleText" | "Feature">;
	targetType: Extract<DataTypesEnum, "CorpusText" | "SampleText" | "Feature">;
	searchInputId: string;
	showAudioAvailability: boolean;
	requireTeiAvailabilityForLink: boolean;
}>();

const openNewWindowFromAnchor = useAnchorClickHandler();
const columnFilters = ref<ColumnFiltersState>([]);
const expanded = ref<ExpandedState>(true);
const globalFilter = ref("");
const grouping = ref<GroupingState>(["country", "region", "settlement"]);
const sorting = ref<SortingState>([{ id: "label", desc: false }]);
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
			cell: (info) => info.getValue(),
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
			cell: (info) => info.getValue(),
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

const items = computed(() => props.items.filter((item) => item.dataType === props.dataType));
const table = useVueTable<simpleTEIMetadata>({
	get data() {
		return items.value;
	},
	get columns() {
		return columns.value;
	},
	initialState: {
		expanded: expanded.value,
		globalFilter: globalFilter.value,
		grouping: grouping.value,
		sorting: sorting.value,
	},
	state: {
		get columnFilters() {
			return columnFilters.value;
		},
		get expanded() {
			return expanded.value;
		},
		get globalFilter() {
			return globalFilter.value;
		},
		get grouping() {
			return grouping.value;
		},
		get sorting() {
			return sorting.value;
		},
	},
	onColumnFiltersChange: (updaterOrValue) => {
		columnFilters.value =
			typeof updaterOrValue === "function" ? updaterOrValue(columnFilters.value) : updaterOrValue;
	},
	onExpandedChange: (updaterOrValue) => {
		expanded.value =
			typeof updaterOrValue === "function" ? updaterOrValue(expanded.value) : updaterOrValue;
	},
	onGlobalFilterChange: (updaterOrValue) => {
		globalFilter.value =
			typeof updaterOrValue === "function" ? updaterOrValue(globalFilter.value) : updaterOrValue;
	},
	onGroupingChange: (updaterOrValue) => {
		grouping.value =
			typeof updaterOrValue === "function" ? updaterOrValue(grouping.value) : updaterOrValue;
	},
	onSortingChange: (updaterOrValue) => {
		sorting.value =
			typeof updaterOrValue === "function" ? updaterOrValue(sorting.value) : updaterOrValue;
	},
	getCoreRowModel: getCoreRowModel(),
	getExpandedRowModel: getExpandedRowModel(),
	getFilteredRowModel: getFilteredRowModel(),
	getGroupedRowModel: getGroupedRowModel(),
	getSortedRowModel: getSortedRowModel(),
	getFacetedRowModel: getFacetedRowModel(),
	getFacetedUniqueValues: customFacetedUniqueValues as unknown as (
		table: TanstackTable<simpleTEIMetadata>,
		columnId: string,
	) => () => Map<unknown, number>,
	globalFilterFn: applyGlobalFilter as FilterFn<simpleTEIMetadata>,
	enableGrouping: true,
	enableSorting: true,
	enableMultiRowSelection: false,
});
const facetColumnIds = [
	"country",
	"region",
	"settlement",
	"category",
	"audioAvailability",
	"@hasTEIw",
];

function formatGroupValue(columnId: string | undefined, value: unknown): string {
	if (typeof value === "string" && value.length > 0) return value.replace(/^zzz_/, "");
	if (typeof value === "number") return value.toString();

	if (columnId === "country") return "Unspecified country";
	if (columnId === "region") return "Unspecified region";
	if (columnId === "settlement") return "Unspecified place";

	return "Unspecified";
}

function countLeafRows(row: Row<simpleTEIMetadata>): number {
	return row.getLeafRows().length;
}

function canOpenItem(item: simpleTEIMetadata): boolean {
	return !props.requireTeiAvailabilityForLink || item["@hasTEIw"] === "true";
}
</script>

<template>
	<div class="grid size-full grid-rows-[auto_1fr] overflow-hidden">
		<div class="flex flex-wrap items-center justify-end gap-2 p-2">
			<label class="text-sm font-medium whitespace-nowrap" :for="searchInputId">Search:</label>
			<input
				:id="searchInputId"
				v-model="globalFilter"
				class="h-8 w-56 rounded-md border border-input px-2"
				type="search"
			/>
			<DataTableActiveFilters :table="table as unknown as TanstackTable<never>" />
			<div class="flex flex-wrap items-center gap-1">
				<span
					v-for="columnId in facetColumnIds"
					:key="columnId"
					class="inline-flex items-center gap-1 text-sm"
				>
					<span>{{ table.getColumn(columnId)?.columnDef.header }}</span>
					<DataTableFacetedFilter
						v-if="table.getColumn(columnId)"
						:column="table.getColumn(columnId)!"
					/>
				</span>
			</div>
			<div class="text-sm">{{ table.getFilteredRowModel().flatRows.length }} results</div>
		</div>
		<div class="relative isolate overflow-auto p-2">
			<div v-if="table.getRowModel().rows.length === 0" class="p-4 text-center text-sm">
				No results.
			</div>
			<ul v-else>
				<li
					v-for="row in table.getRowModel().rows"
					:key="row.id"
					class="py-0.5 text-base"
					:style="{ marginLeft: `${row.depth * 1.25}rem` }"
				>
					<button
						v-if="row.getIsGrouped()"
						:aria-expanded="row.getIsExpanded()"
						class="inline-flex items-center gap-2 py-1 font-semibold"
						type="button"
						@click="row.toggleExpanded()"
					>
						<ChevronDown v-if="row.getIsExpanded()" class="size-4" />
						<ChevronRight v-else class="size-4" />
						<span>{{
							formatGroupValue(row.groupingColumnId, row.getValue(row.groupingColumnId!))
						}}</span>
						<span class="text-sm font-normal">({{ countLeafRows(row) }})</span>
					</button>
					<div v-else class="flex items-center">
						<a
							v-if="canOpenItem(row.original)"
							class="text-primary underline"
							:data-target-type="targetType"
							:data-text-id="row.original.id"
							href="#"
							@click="openNewWindowFromAnchor"
						>
							{{ row.original.label }}
						</a>
						<span v-else>{{ row.original.label }}</span>
						<span> &nbsp; </span>
						<template v-if="showAudioAvailability">
							<span
								v-if="row.original.audioAvailability === 'free'"
								title="Audio recording is publicly available"
							>
								<Volume2 class="mx-2 mt-[2px] size-5" />
							</span>
							<span v-else title="Audio recording is restricted">
								<VolumeX class="mx-2 mt-[2px] size-5" />
							</span>
						</template>
					</div>
				</li>
			</ul>
		</div>
	</div>
</template>
