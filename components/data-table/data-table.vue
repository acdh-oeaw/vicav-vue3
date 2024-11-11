<script lang="ts" setup>
import {
	type ColumnDef,
	type ColumnFiltersState,
	FlexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useVueTable,
} from "@tanstack/vue-table";

import customFacetedUniqueValues from "@/utils/customFacetedUniqueValues";

const emit = defineEmits(["table-ready", "columnFiltersChange", "globalFilterChange"]);

interface Props {
	items: Array<never>;
	columns: Array<ColumnDef<never>>;
	minHeaderDepth?: number;
	enableFilterOnColumns?: boolean;
	initialColumnVisibility?: Record<string, boolean>;
}

const props = defineProps<Props>();
const { items, columns } = toRefs(props);
const columnFilters = ref<ColumnFiltersState>([]);
const globalFilter = ref("");
const table = useVueTable({
	get data() {
		return items.value;
	},
	get columns() {
		return columns.value;
	},
	initialState: {
		columnVisibility: {
			label: true,
			person: false,
			age: false,
			sex: false,
			type: true,
			region: true,
			settlement: true,
			date: true,
			respPerson: true,
			...props.initialColumnVisibility,
		},
	},
	state: {
		get columnFilters() {
			return columnFilters.value;
		},
		get globalFilter() {
			return globalFilter.value;
		},
	},
	onColumnFiltersChange: (updaterOrValue) => {
		columnFilters.value =
			typeof updaterOrValue === "function" ? updaterOrValue(columnFilters.value) : updaterOrValue;
		emit("columnFiltersChange", columnFilters.value);
	},
	onGlobalFilterChange: (updaterOrValue) => {
		globalFilter.value =
			typeof updaterOrValue === "function" ? updaterOrValue(globalFilter.value) : updaterOrValue;
		emit("globalFilterChange", globalFilter.value);
	},
	getCoreRowModel: getCoreRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
	getFilteredRowModel: getFilteredRowModel(),
	getFacetedRowModel: getFacetedRowModel(),
	getFacetedUniqueValues: customFacetedUniqueValues,
});

onMounted(() => {
	emit("table-ready", table);
});
</script>

<template>
	<Table>
		<TableHeader class="bg-primary font-bold text-on-primary">
			<TableRow
				v-for="headerGroup in table
					.getHeaderGroups()
					.filter((header) => header.depth >= (props.minHeaderDepth ?? 0))"
				:key="headerGroup.id"
				class="hover:bg-primary"
			>
				<TableHead v-for="header in headerGroup.headers" :key="header.id">
					{{ header.column.columnDef.header }}
					<DataTableFacetedFilter
						v-if="enableFilterOnColumns && header.column.getCanFilter()"
						:column="header.column"
					></DataTableFacetedFilter>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<template v-if="table.getRowModel().rows?.length">
				<TableRow v-for="row in table.getRowModel().rows" :key="row.id">
					<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
						<FlexRender :props="cell.getContext()" :render="cell.column.columnDef.cell" />
					</TableCell>
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
