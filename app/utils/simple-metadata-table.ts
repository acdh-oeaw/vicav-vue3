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
	type Updater,
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
import { matchesFilterValueMap } from "@/utils/filter-value-map.ts";
import {
	deserializeSimpleMetadataFacetFilters,
	serializeSimpleMetadataFacetFilters,
	type SimpleMetadataFacetSelections,
} from "@/utils/simple-metadata-facets.ts";

export interface SimpleMetadataTableOptions {
	getItems: () => Array<simpleTEIMetadata>;
	dataType: DataTypesEnum;
	defaultFacets?: SimpleMetadataFacetSelections;
	listState?: SimpleMetadataListState;
}

export function createSimpleMetadataTable(options: SimpleMetadataTableOptions) {
	const defaultFacets = computed(() => options.defaultFacets ?? {});
	const columnFilters = ref<ColumnFiltersState>(
		deserializeSimpleMetadataFacetFilters(options.listState, defaultFacets.value),
	);
	const expanded = ref<ExpandedState>(true);
	const globalFilter = ref(options.listState?.globalFilter ?? "");
	const grouping = ref<GroupingState>(["country", "region", "settlement"]);
	const sorting = ref<SortingState>([]);
	const columnHelper = createColumnHelper<simpleTEIMetadata>();
	const labelCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
	type SimpleMetadataSortMode = "hit-count" | "alphabetical";
	const sortMode = ref<SimpleMetadataSortMode>(options.listState?.sortMode ?? "alphabetical");
	function serializeListState(): SimpleMetadataListState | undefined {
		const listState: SimpleMetadataListState = {};
		const facets = serializeFacetFilters();

		if (sortMode.value !== "alphabetical") listState.sortMode = sortMode.value;
		if (globalFilter.value.length > 0) listState.globalFilter = globalFilter.value;
		if (Object.keys(facets).length > 0) listState.facets = facets;

		return Object.keys(listState).length > 0 ? listState : undefined;
	}

	function serializeFacetFilters(): NonNullable<SimpleMetadataListState["facets"]> {
		return serializeSimpleMetadataFacetFilters(columnFilters.value, defaultFacets.value);
	}

	function normalizePlaceSortValue(value: string): string {
		return value.replace(/^zzz_/, "");
	}

	function compareStringValues(a: unknown, b: unknown): number {
		return labelCollator.compare(sortValue(a), sortValue(b));
	}

	function sortValue(value: unknown): string {
		if (typeof value === "string") return value;
		if (typeof value === "number" || typeof value === "boolean") return String(value);
		return "";
	}

	function comparePlaceStringValues(a: unknown, b: unknown): number {
		const normalizedA = normalizePlaceSortValue(sortValue(a));
		const normalizedB = normalizePlaceSortValue(sortValue(b));
		const isEmptyA = normalizedA.length === 0;
		const isEmptyB = normalizedB.length === 0;

		if (isEmptyA && !isEmptyB) return 1;
		if (!isEmptyA && isEmptyB) return -1;

		return labelCollator.compare(normalizedA, normalizedB);
	}

	function comparePlaceUndefinedPosition(a: unknown, b: unknown): number {
		const isEmptyA = normalizePlaceSortValue(sortValue(a)).length === 0;
		const isEmptyB = normalizePlaceSortValue(sortValue(b)).length === 0;

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
					: comparePlaceStringValues(
							getSimpleMetadataValue(a, key),
							getSimpleMetadataValue(b, key),
						);

			if (compareValues !== 0) return compareValues;
		}

		return 0;
	}

	function facetedStringFilter(
		row: Row<simpleTEIMetadata>,
		columnId: string,
		filterValue: unknown,
	) {
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
			enableColumnFilter: accessor.filterable,
			enableGrouping: "groupable" in accessor ? accessor.groupable : false,
			enableSorting: accessor.sortable,
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
		return options
			.getItems()
			.filter((item) => item.dataType === options.dataType)
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
		onGlobalFilterChange: (updaterOrValue: Updater<string>) => {
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

	return {
		table,
		columnFilters,
		expanded,
		globalFilter,
		grouping,
		sorting,
		sortMode,
		serializeListState,
		normalizePlaceSortValue,
		compareStringValues,
		comparePlaceUndefinedPosition,
	};
}
export type SimpleMetadataTable = ReturnType<typeof createSimpleMetadataTable>;
