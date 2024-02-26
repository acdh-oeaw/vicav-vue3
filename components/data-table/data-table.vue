<script lang="ts" setup>
import {
	type ColumnDef,
	FlexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useVueTable,
} from "@tanstack/vue-table";

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
	getPaginationRowModel: getPaginationRowModel(),
});

onMounted(() => {
	emit("table-ready", table);
});
</script>

<template>
	<Table>
		<TableHeader class="bg-primary font-bold text-on-primary">
			<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
				<TableHead v-for="header in headerGroup.headers" :key="header.id">
					{{ header.column.columnDef.header }}
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<template v-if="table.getRowModel().rows?.length">
				<TableRow v-for="row in table.getRowModel().rows" :key="row.id">
					<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
						<FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
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
