<script setup lang="ts">
import { Filter, X } from "@lucide/vue";
import type { ColumnFilter, Table } from "@tanstack/vue-table";

import { ensureFilterValueMap, FilterValueMap } from "@/utils/filter-value-map";

const props = defineProps<{
	formatValue?: (columnId: string, value: string) => string;
	table: Table<never>;
}>();

const activeFilterColumns = computed(() =>
	props.table.getState().columnFilters.filter((c: ColumnFilter) => {
		const value = ensureFilterValueMap(c.value);
		return value.size > 0 || value.exclude.size > 0;
	}),
);
function removeFilters(colId: string) {
	props.table.getColumn(colId)?.setFilterValue(new FilterValueMap());
}
function removeAllFilters() {
	props.table.resetColumnFilters();
}
function removeValFromColumnFilter(col: ColumnFilter, val: string) {
	const map = ensureFilterValueMap(col.value);
	map.delete(val);
	props.table.getColumn(col.id)?.setFilterValue(map);
}
function getSelectedValues(col: ColumnFilter): Array<string> {
	return [...ensureFilterValueMap(col.value).keys()];
}
function formatFilterValue(columnId: string, value: string): string {
	return props.formatValue?.(columnId, value) ?? value;
}
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button
				class="ml-auto hidden h-8 lg:flex"
				:disabled="activeFilterColumns.length === 0"
				size="sm"
				variant="outline"
			>
				<Filter class="mr-2 size-4" />
				Active Filters
				<Badge class="ml-2" variant="outline">{{ activeFilterColumns.length }}</Badge>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="max-h-[350px] w-72 max-w-none overflow-y-auto">
			<DropdownMenuLabel class="flex items-center justify-between"
				><span>Remove filters</span
				><Button
					class="ml-2 flex h-8 gap-1"
					:disabled="activeFilterColumns.length === 0"
					size="sm"
					variant="outline"
					@click="removeAllFilters()"
				>
					<X class="size-4 align-middle hover:scale-125"></X><span>Remove all</span></Button
				></DropdownMenuLabel
			>
			<DropdownMenuSeparator />
			<div
				v-for="col in activeFilterColumns"
				:key="col.id"
				class="flex justify-between p-2 text-sm"
			>
				<span
					>{{ props.table.getColumn(col.id)?.columnDef.header }}
					<Badge
						v-for="val in getSelectedValues(col)"
						:key="val"
						class="mx-0.5 cursor-pointer"
						title="Remove"
						variant="secondary"
						@click="removeValFromColumnFilter(col, val)"
						>{{ formatFilterValue(col.id, val) }}</Badge
					> </span
				><button @click="removeFilters(col.id)">
					<X class="size-4 hover:scale-125"></X><span class="sr-only">Remove filter</span>
				</button>
			</div>
			<span v-if="activeFilterColumns.length === 0" class="m-2 text-sm text-neutral-600"
				>No filters active.</span
			>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
