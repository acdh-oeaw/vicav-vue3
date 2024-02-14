<script lang="ts" setup>
import { type ColumnDef, getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import { defineEmits, defineProps } from "vue";

const emit = defineEmits(["table-ready"]);

interface Props {
	items: Array<never>;
	columns: Array<ColumnDef<never>>;
}

const props = defineProps<Props>();
const { items, columns } = toRefs(props);

const table = useVueTable({
	get data() {
		return items.value;
	},
	get columns() {
		return columns.value;
	},
	getCoreRowModel: getCoreRowModel(),
});

onMounted(() => {
	emit("table-ready", table);
});
</script>

<template>
	<Table>
		<TableHeader>
			<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
				<TableHead v-for="header in headerGroup.headers" :key="header.id">
					{{ header.column.columnDef.header }}
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<template v-if="table.getRowModel().rows?.length">
				<TableRow
					v-for="row in table.getRowModel().rows"
					:key="row.id"
					:data-state="row.getIsSelected() ? 'selected' : undefined"
				>
					<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
						{{ cell.row.original.properties[cell.column.columnDef.id] }}
					</TableCell>
				</TableRow>
			</template>
			<template v-else>
				<TableRow>
					<TableCell :col-span="columns.length" class="h-24 text-center">No results.</TableCell>
				</TableRow>
			</template>
		</TableBody>
	</Table>
</template>
