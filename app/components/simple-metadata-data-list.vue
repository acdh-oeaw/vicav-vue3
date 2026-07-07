<script setup lang="ts">
import { debounce } from "@acdh-oeaw/lib";
import {
	ArrowDownAZ,
	ChartNoAxesColumnIncreasing,
	ChevronDown,
	ChevronRight,
	Volume2,
	VolumeX,
} from "@lucide/vue";
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

import {
	getSimpleMetadataValue,
	type SimpleMetadataAccessorKey,
	simpleMetadataAccessors,
} from "@/stores/use-tei-headers-store.ts";
import type { DataTypesEnum, SimpleMetadataListState } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";
import customFacetedUniqueValues from "@/utils/customFacetedUniqueValues.ts";
import {
	ensureFilterValueMap,
	FilterValueMap,
	matchesFilterValueMap,
} from "@/utils/filter-value-map.ts";

const props = defineProps<{
	items: Array<simpleTEIMetadata>;
	dataType: Extract<DataTypesEnum, "CorpusText" | "SampleText" | "Feature" | "Profile">;
	targetType: Extract<DataTypesEnum, "CorpusText" | "SampleText" | "Feature" | "Profile">;
	searchInputId: string;
	showAudioAvailability: boolean;
	requireTeiAvailabilityForLink: boolean;
	listState?: SimpleMetadataListState;
}>();
const emit = defineEmits<{
	"update:listState": [listState: SimpleMetadataListState | undefined];
}>();

const openNewWindowFromAnchor = useAnchorClickHandler();
const columnFilters = ref<ColumnFiltersState>(deserializeColumnFilters(props.listState));
const expanded = ref<ExpandedState>(true);
const globalFilter = ref(props.listState?.globalFilter ?? "");
const grouping = ref<GroupingState>(["country", "region", "settlement"]);
const sorting = ref<SortingState>([]);
const columnHelper = createColumnHelper<simpleTEIMetadata>();
const labelCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
type SimpleMetadataSortMode = "hit-count" | "alphabetical";
const sortMode = ref<SimpleMetadataSortMode>(props.listState?.sortMode ?? "alphabetical");
const selectedSortMode = computed<SimpleMetadataSortMode | undefined>({
	get: () => sortMode.value,
	set: (value) => {
		if (value != null) sortMode.value = value;
	},
});
const emitListStateUpdate = debounce(() => {
	emit("update:listState", serializeListState());
}, 150);

watch(
	[globalFilter, sortMode, columnFilters],
	() => {
		emitListStateUpdate();
	},
	{ deep: true },
);

function deserializeColumnFilters(listState?: SimpleMetadataListState): ColumnFiltersState {
	return Object.entries(listState?.facets ?? {}).map(([id, values]) => {
		return {
			id,
			value: new FilterValueMap(values.map((value) => [value, 1])),
		};
	});
}

function serializeListState(): SimpleMetadataListState | undefined {
	const listState: SimpleMetadataListState = {};
	const facets = serializeFacetFilters();

	if (sortMode.value !== "alphabetical") listState.sortMode = sortMode.value;
	if (globalFilter.value.length > 0) listState.globalFilter = globalFilter.value;
	if (Object.keys(facets).length > 0) listState.facets = facets;

	return Object.keys(listState).length > 0 ? listState : undefined;
}

function serializeFacetFilters(): NonNullable<SimpleMetadataListState["facets"]> {
	const facets: NonNullable<SimpleMetadataListState["facets"]> = {};

	for (const filter of columnFilters.value) {
		const filterValueMap = ensureFilterValueMap(filter.value);
		const values = [...filterValueMap.keys()];

		if (values.length > 0) facets[filter.id] = values;
	}

	return facets;
}

function normalizePlaceSortValue(value: string): string {
	return value.replace(/^zzz_/, "");
}

function compareStringValues(a: unknown, b: unknown): number {
	return labelCollator.compare(String(a ?? ""), String(b ?? ""));
}

function comparePlaceStringValues(a: unknown, b: unknown): number {
	const normalizedA = normalizePlaceSortValue(String(a ?? ""));
	const normalizedB = normalizePlaceSortValue(String(b ?? ""));
	const isEmptyA = normalizedA.length === 0;
	const isEmptyB = normalizedB.length === 0;

	if (isEmptyA && !isEmptyB) return 1;
	if (!isEmptyA && isEmptyB) return -1;

	return labelCollator.compare(normalizedA, normalizedB);
}

function comparePlaceUndefinedPosition(a: unknown, b: unknown): number {
	const isEmptyA = normalizePlaceSortValue(String(a ?? "")).length === 0;
	const isEmptyB = normalizePlaceSortValue(String(b ?? "")).length === 0;

	if (isEmptyA && !isEmptyB) return 1;
	if (!isEmptyA && isEmptyB) return -1;

	return 0;
}

function compareSimpleMetadataItems(a: simpleTEIMetadata, b: simpleTEIMetadata): number {
	const comparisonKeys: Array<SimpleMetadataAccessorKey> = [
		"country",
		"region",
		"settlement",
		"label",
	];

	for (const key of comparisonKeys) {
		const compareValues =
			key === "label"
				? compareStringValues(getSimpleMetadataValue(a, key), getSimpleMetadataValue(b, key))
				: comparePlaceStringValues(getSimpleMetadataValue(a, key), getSimpleMetadataValue(b, key));

		if (compareValues !== 0) return compareValues;
	}

	return 0;
}

function facetedStringFilter(row: Row<simpleTEIMetadata>, columnId: string, filterValue: unknown) {
	return matchesFilterValueMap(row.getValue(columnId), filterValue);
}

function applyGlobalFilter(row: Row<simpleTEIMetadata>, _columnId: string, filterValue: string) {
	if (!filterValue) return true;

	const query = filterValue.toLocaleLowerCase();
	const searchableKeys: Array<SimpleMetadataAccessorKey> = [
		"id",
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

const items = computed(() => {
	return props.items
		.filter((item) => item.dataType === props.dataType)
		.toSorted(compareSimpleMetadataItems);
});
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
const placeHierarchyColumnIds = ["country", "region", "settlement"];
const hideSingleValueFilterColumnIds = [
	...placeHierarchyColumnIds,
	"category",
	"audioAvailability",
	"@hasTEIw",
];

interface FacetedColumn {
	getFacetedUniqueValues: () => Map<unknown, number>;
}

interface DisplayRow {
	row: Row<simpleTEIMetadata>;
	depth: number;
}

const visibleFacetColumnIds = computed(() => {
	return facetColumnIds.filter((columnId) => {
		const column = table.getColumn(columnId);

		return column != null && !hasSingleFilterValue(columnId, column);
	});
});

const displayRows = computed<Array<DisplayRow>>(() => {
	return flattenDisplayRows(table.getPreExpandedRowModel().rows);
});

function flattenDisplayRows(
	rows: Array<Row<simpleTEIMetadata>>,
	skippedAncestorCount = 0,
): Array<DisplayRow> {
	return rows.toSorted(compareRowsBySortMode).flatMap((row) => {
		const isEmptyPlaceGroup = isEmptyPlaceHierarchyGroup(row);
		const nextSkippedAncestorCount = skippedAncestorCount + (isEmptyPlaceGroup ? 1 : 0);
		const childRows =
			row.subRows.length > 0 && (row.getIsExpanded() || isEmptyPlaceGroup)
				? flattenDisplayRows(row.subRows, nextSkippedAncestorCount)
				: [];

		if (isEmptyPlaceGroup) return childRows;

		return [{ row, depth: row.depth - skippedAncestorCount }, ...childRows];
	});
}

function compareRowsBySortMode(a: Row<simpleTEIMetadata>, b: Row<simpleTEIMetadata>): number {
	if (sortMode.value === "hit-count") return compareRowsByHitCount(a, b);

	return compareRowsAlphabetically(a, b);
}

function compareRowsByHitCount(a: Row<simpleTEIMetadata>, b: Row<simpleTEIMetadata>): number {
	const placeUndefinedPosition = compareRowsByPlaceUndefinedPosition(a, b);

	if (placeUndefinedPosition !== 0) return placeUndefinedPosition;

	if (a.getIsGrouped() && b.getIsGrouped()) {
		const countComparison = countLeafRows(b) - countLeafRows(a);

		if (countComparison !== 0) return countComparison;
	}

	return compareRowsAlphabetically(a, b);
}

function compareRowsAlphabetically(a: Row<simpleTEIMetadata>, b: Row<simpleTEIMetadata>): number {
	const placeUndefinedPosition = compareRowsByPlaceUndefinedPosition(a, b);

	if (placeUndefinedPosition !== 0) return placeUndefinedPosition;
	if (a.getIsGrouped() && !b.getIsGrouped()) return -1;
	if (!a.getIsGrouped() && b.getIsGrouped()) return 1;
	if (!a.getIsGrouped() && !b.getIsGrouped()) {
		return compareStringValues(a.original.label, b.original.label);
	}

	return compareStringValues(getRowGroupSortValue(a), getRowGroupSortValue(b));
}

function compareRowsByPlaceUndefinedPosition(
	a: Row<simpleTEIMetadata>,
	b: Row<simpleTEIMetadata>,
): number {
	if (!a.getIsGrouped() || !b.getIsGrouped()) return 0;
	if (a.groupingColumnId !== b.groupingColumnId) return 0;
	if (a.groupingColumnId == null || !placeHierarchyColumnIds.includes(a.groupingColumnId)) return 0;

	const groupingColumnId = a.groupingColumnId;

	return comparePlaceUndefinedPosition(a.getValue(groupingColumnId), b.getValue(groupingColumnId));
}

function getRowGroupSortValue(row: Row<simpleTEIMetadata>): string {
	if (row.groupingColumnId == null) return "";
	if (placeHierarchyColumnIds.includes(row.groupingColumnId)) {
		return normalizePlaceSortValue(String(row.getValue(row.groupingColumnId) ?? ""));
	}

	return String(row.getValue(row.groupingColumnId) ?? "");
}

function formatGroupValue(columnId: string | undefined, value: unknown): string {
	if (typeof value === "string" && value.length > 0) return value.replace(/^zzz_/, "");
	if (typeof value === "number") return value.toString();

	if (columnId === "country") return "Unspecified country";
	if (columnId === "region") return "Unspecified region";
	if (columnId === "settlement") return "Unspecified place";

	return "Unspecified";
}

function hasSingleFilterValue(columnId: string, column: FacetedColumn): boolean {
	if (!hideSingleValueFilterColumnIds.includes(columnId)) return false;

	const values = [...column.getFacetedUniqueValues().keys()];

	return values.length <= 1;
}

function shouldPutUndefinedFacetLast(columnId: string): boolean {
	return placeHierarchyColumnIds.includes(columnId);
}

function isEmptyPlaceHierarchyGroup(row: Row<simpleTEIMetadata>): boolean {
	if (!row.getIsGrouped()) return false;
	if (row.groupingColumnId == null) return false;
	if (!placeHierarchyColumnIds.includes(row.groupingColumnId)) return false;

	return row.getValue(row.groupingColumnId) === "";
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
		<div class="flex flex-wrap items-center justify-between gap-2 p-2">
			<div class="flex flex-wrap items-center gap-2">
				<TooltipProvider :delay-duration="100">
					<ToggleGroup
						v-model="selectedSortMode"
						aria-label="Sort list"
						class="shrink-0"
						type="single"
						variant="outline"
					>
						<Tooltip>
							<TooltipTrigger as-child>
								<ToggleGroupItem
									aria-label="Sort by hit count"
									class="h-8 min-w-8 px-2 hover:bg-primary hover:text-on-primary"
									:class="
										sortMode === 'hit-count'
											? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary'
											: ''
									"
									value="hit-count"
								>
									<ChartNoAxesColumnIncreasing class="size-4" />
								</ToggleGroupItem>
							</TooltipTrigger>
							<TooltipContent class="border-black bg-black text-white">
								Sort branches by hit count.
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger as-child>
								<ToggleGroupItem
									aria-label="Sort alphabetically"
									class="h-8 min-w-8 px-2 hover:bg-primary hover:text-on-primary"
									:class="
										sortMode === 'alphabetical'
											? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary'
											: ''
									"
									value="alphabetical"
								>
									<ArrowDownAZ class="size-4" />
								</ToggleGroupItem>
							</TooltipTrigger>
							<TooltipContent class="border-black bg-black text-white">
								Sort branches alphabetically.
							</TooltipContent>
						</Tooltip>
					</ToggleGroup>
				</TooltipProvider>
				<label class="text-sm font-medium whitespace-nowrap" :for="searchInputId">Search:</label>
				<input
					:id="searchInputId"
					v-model="globalFilter"
					class="h-8 w-56 rounded-md border border-input px-2"
					type="search"
				/>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-2">
				<DataTableActiveFilters :table="table as unknown as TanstackTable<never>" />
				<div class="flex flex-wrap items-center gap-1">
					<span
						v-for="columnId in visibleFacetColumnIds"
						:key="columnId"
						class="inline-flex items-center gap-1 text-sm"
					>
						<span>{{ table.getColumn(columnId)?.columnDef.header }}</span>
						<DataTableFacetedFilter
							v-if="table.getColumn(columnId)"
							:column="table.getColumn(columnId)!"
							:sort-mode="sortMode"
							:sort-value="normalizePlaceSortValue"
							:undefined-values-last="shouldPutUndefinedFacetLast(columnId)"
						/>
					</span>
				</div>
				<div class="text-sm">{{ table.getFilteredRowModel().flatRows.length }} results</div>
			</div>
		</div>
		<div class="relative isolate overflow-auto p-2">
			<div v-if="displayRows.length === 0" class="p-4 text-center text-sm">No results.</div>
			<ul v-else>
				<li
					v-for="{ row, depth } in displayRows"
					:key="row.id"
					class="py-0.5 text-base"
					:style="{ marginLeft: `${depth * 1.25}rem` }"
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
						<span class="ml-2 text-sm text-muted-foreground">({{ row.original.id }})</span>
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
