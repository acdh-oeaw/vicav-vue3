<script lang="ts" setup>
import { ChevronDown, ChevronRight, ChevronsUpDown } from "@lucide/vue";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type ExpandedState,
	type FilterFn,
	FlexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFacetedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type GroupingState,
	type PaginationState,
	type SortingState,
	useVueTable,
	type VisibilityState,
} from "@tanstack/vue-table";

import customFacetedUniqueValues from "@/utils/customFacetedUniqueValues.ts";

const emit = defineEmits([
	"table-ready",
	"columnFiltersChange",
	"globalFilterChange",
	"row-click",
	"column-header-click",
]);

interface RowWithSubRows {
	subRows: Array<RowWithSubRows>;
}

interface HeaderFilterColumn {
	id: string;
	getCanFilter: () => boolean;
	getFacetedUniqueValues: () => Map<unknown, number>;
}

interface Props {
	items: Array<never>;
	columns: Array<ColumnDef<never>>;
	minHeaderDepth?: number;
	enableFilterOnColumns?: boolean;
	enableGrouping?: boolean;
	enablePagination?: boolean;
	enableSorting?: boolean;
	initialExpanded?: ExpandedState;
	initialGrouping?: GroupingState;
	initialPagination?: PaginationState;
	initialColumnVisibility?: Record<string, boolean>;
	initialSorting?: SortingState;
	globalFilterFn?: unknown;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	visibilityChangeFn?: Function;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	columnFilterChangeFn?: Function;
	stickyHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	enablePagination: true,
});
const { items, columns, initialColumnVisibility } = toRefs(props);
const columnFilters = ref<ColumnFiltersState>([]);
const expanded = ref<ExpandedState>(props.initialExpanded ?? {});
const globalFilter = ref("");
const grouping = ref<GroupingState>(props.initialGrouping ?? []);
const pagination = ref<PaginationState>(props.initialPagination ?? { pageIndex: 0, pageSize: 10 });
const sorting = ref<SortingState>(props.initialSorting ?? []);
const placeHierarchyColumnIds = ["country", "region", "settlement"];
const hideSingleValueFilterColumnIds = [
	...placeHierarchyColumnIds,
	"category",
	"audioAvailability",
	"@hasTEIw",
];
const columnVisibility = ref<VisibilityState>({
	label: true,
	person: false,
	age: false,
	sex: false,
	type: true,
	region: true,
	settlement: true,
	date: true,
	respPerson: true,
	...initialColumnVisibility.value,
});
const table = useVueTable({
	get data() {
		return items.value;
	},
	get columns() {
		return columns.value;
	},
	initialState: {
		columnVisibility: columnVisibility.value,
		expanded: expanded.value,
		globalFilter: globalFilter.value,
		grouping: grouping.value,
		pagination: pagination.value,
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
		get pagination() {
			return pagination.value;
		},
		get sorting() {
			return sorting.value;
		},
		get columnVisibility() {
			return columnVisibility.value;
		},
	},
	onColumnFiltersChange: (updaterOrValue) => {
		columnFilters.value =
			typeof updaterOrValue === "function" ? updaterOrValue(columnFilters.value) : updaterOrValue;
		emit("columnFiltersChange", columnFilters.value);
		if (props.columnFilterChangeFn) {
			props.columnFilterChangeFn(columnFilters.value);
		}
	},
	onExpandedChange: (updaterOrValue) => {
		expanded.value =
			typeof updaterOrValue === "function" ? updaterOrValue(expanded.value) : updaterOrValue;
	},
	onGlobalFilterChange: (updaterOrValue) => {
		globalFilter.value =
			typeof updaterOrValue === "function" ? updaterOrValue(globalFilter.value) : updaterOrValue;
		emit("globalFilterChange", globalFilter.value);
	},
	onGroupingChange: (updaterOrValue) => {
		grouping.value =
			typeof updaterOrValue === "function" ? updaterOrValue(grouping.value) : updaterOrValue;
	},
	onPaginationChange: (updaterOrValue) => {
		pagination.value =
			typeof updaterOrValue === "function" ? updaterOrValue(pagination.value) : updaterOrValue;
	},
	onSortingChange: (updaterOrValue) => {
		sorting.value =
			typeof updaterOrValue === "function" ? updaterOrValue(sorting.value) : updaterOrValue;
	},
	onColumnVisibilityChange: (updaterOrValue) => {
		columnVisibility.value =
			typeof updaterOrValue === "function"
				? updaterOrValue(columnVisibility.value)
				: updaterOrValue;
		if (props.visibilityChangeFn) {
			props.visibilityChangeFn({
				table,
				//@ts-expect-error missing optional argument for updaterOrValue()
				col: typeof updaterOrValue === "function" ? updaterOrValue() : updaterOrValue,
			});
		}
	},
	getCoreRowModel: getCoreRowModel(),
	getExpandedRowModel: props.enableGrouping ? getExpandedRowModel() : undefined,
	getFilteredRowModel: getFilteredRowModel(),
	getGroupedRowModel: props.enableGrouping ? getGroupedRowModel() : undefined,
	getPaginationRowModel: !props.enablePagination ? undefined : getPaginationRowModel(),
	getSortedRowModel: props.enableSorting ? getSortedRowModel() : undefined,
	getFacetedRowModel: getFacetedRowModel(),
	getFacetedUniqueValues: customFacetedUniqueValues,
	globalFilterFn: props.globalFilterFn as FilterFn<never> | undefined,
	enableGrouping: props.enableGrouping ?? false,
	enableSorting: props.enableSorting ?? false,
	enableMultiRowSelection: false,
});

onMounted(() => {
	emit("table-ready", table);
});

function formatGroupValue(columnId: string | undefined, value: unknown): string {
	if (typeof value === "string" && value.length > 0) return value.replace(/^zzz_/, "");
	if (typeof value === "number") return value.toString();

	if (columnId === "country") return "Unspecified country";
	if (columnId === "region") return "Unspecified region";
	if (columnId === "settlement") return "Unspecified place";

	return "Unspecified";
}

function hasSingleFilterValue(column: HeaderFilterColumn): boolean {
	if (!hideSingleValueFilterColumnIds.includes(column.id)) return false;

	const values = [...column.getFacetedUniqueValues().keys()];

	return values.length <= 1;
}

function canShowColumnFilter(column: HeaderFilterColumn): boolean {
	return column.getCanFilter() && !hasSingleFilterValue(column);
}

function countLeafRows(row: RowWithSubRows): number {
	if (row.subRows.length === 0) return 1;

	return row.subRows.reduce((count, subRow) => count + countLeafRows(subRow), 0);
}
</script>

<template>
	<Table
		:class="{ 'border-separate border-spacing-0': stickyHeader }"
		:style="{ overflow: stickyHeader ? 'unset' : '' }"
	>
		<TableHeader class="bg-primary font-bold text-on-primary">
			<TableRow
				v-for="(headerGroup, headerGroupIndex) in table
					.getHeaderGroups()
					.filter((header) => header.depth >= (props.minHeaderDepth ?? 0))"
				:key="headerGroup.id"
				class="hover:bg-primary"
			>
				<TableHead
					v-for="header in headerGroup.headers"
					:key="header.id"
					:class="{ 'sticky z-20 bg-primary': stickyHeader }"
					:style="stickyHeader ? { top: `${headerGroupIndex * 3}rem` } : undefined"
					@click="emit('column-header-click', header)"
				>
					<button
						v-if="enableSorting && header.column.getCanSort()"
						class="inline-flex items-center gap-1"
						type="button"
						@click="header.column.getToggleSortingHandler()?.($event)"
					>
						<span>{{ header.column.columnDef.header }}</span>
						<ChevronDown v-if="header.column.getIsSorted() === 'desc'" class="size-4" />
						<ChevronRight
							v-else-if="header.column.getIsSorted() === 'asc'"
							class="size-4 -rotate-90"
						/>
						<ChevronsUpDown v-else class="size-4 opacity-70" />
					</button>
					<template v-else>{{ header.column.columnDef.header }}</template>
					<DataTableFacetedFilter
						v-if="enableFilterOnColumns && canShowColumnFilter(header.column)"
						:column="header.column"
					></DataTableFacetedFilter>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<template v-if="table.getRowModel().rows?.length">
				<TableRow
					v-for="row in table.getRowModel().rows"
					:key="row.id"
					:class="{ 'bg-secondary': row.getIsSelected() }"
					@click="row.getIsGrouped() ? row.toggleExpanded() : emit('row-click', row)"
				>
					<template v-if="enableGrouping && row.getIsGrouped()">
						<TableCell :col-span="row.getVisibleCells().length">
							<button
								class="inline-flex items-center gap-2 font-semibold"
								:style="{ paddingLeft: `${row.depth * 1.25}rem` }"
								type="button"
								@click.stop="row.toggleExpanded()"
							>
								<ChevronDown v-if="row.getIsExpanded()" class="size-4" />
								<ChevronRight v-else class="size-4" />
								<span>{{
									formatGroupValue(row.groupingColumnId, row.getValue(row.groupingColumnId!))
								}}</span>
								<span class="text-sm font-normal">({{ countLeafRows(row) }})</span>
							</button>
						</TableCell>
					</template>
					<template v-else>
						<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
							<FlexRender :props="cell.getContext()" :render="cell.column.columnDef.cell" />
						</TableCell>
					</template>
				</TableRow>
			</template>
			<template v-else>
				<TableRow>
					<TableCell class="h-24 text-center" :col-span="columns.length">No results.</TableCell>
				</TableRow>
			</template>
		</TableBody>
	</Table>
</template>
