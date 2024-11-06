<script setup lang="ts">
import type { ColumnFilter, Table } from "@tanstack/vue-table";
import { Filter, X } from "lucide-vue-next";

const props = defineProps<{
	table: Table<never>;
}>();

const activeFilterColumns = computed(() =>
	props.table
		.getState()
		.columnFilters.filter((c: ColumnFilter) => (c.value as Array<string>).length > 0),
);
function removeFilters(colId: string) {
	props.table.getColumn(colId)?.setFilterValue([]);
}
function removeAllFilters() {
	props.table.resetColumnFilters();
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
		<DropdownMenuContent align="end" class="max-h-[350px] w-80 max-w-none overflow-y-auto">
			<DropdownMenuLabel class="flex items-center justify-between"
				><span>Remove column filters</span
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
				<span>{{ props.table.getColumn(col.id)?.columnDef.header }}</span
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
