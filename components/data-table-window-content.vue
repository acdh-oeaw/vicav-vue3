<script lang="ts" setup>
import { type ColumnFiltersState, createColumnHelper, type Table } from "@tanstack/vue-table";
import { h } from "vue";

import { useTEIHeaders } from "@/composables/use-tei-headers";
import type { DataTableWindowItem, simpleTEIMetadata } from "@/types/global.d";

interface Props {
	params: DataTableWindowItem["params"];
}

defineProps<Props>();

const { simpleItems } = useTEIHeaders();
const openNewWindowFromAnchor = useAnchorClickHandler();
const columnHelper = createColumnHelper<simpleTEIMetadata>();

const columns = ref([
	columnHelper.accessor((row) => row.label, {
		id: "label",
		cell: (info) => {
			const identifier =
				info.getValue() +
				(info.row.original.person.sex ? `/${info.row.original.person.sex}` : "") +
				(info.row.original.person.age ? `/${info.row.original.person.age}` : "");
			return info.row.original.dataType !== "CorpusText" || info.row.original.hasTEIw
				? h(
						"a",
						{
							class: "underline color-primary",
							"data-target-type": info.row.original.dataType,
							"data-text-id": info.row.original.id,
						},
						identifier,
					)
				: identifier;
		},
		header: "Name",
		footer: (props) => props.column.id,
	}),
	columnHelper.accessor((row) => row.dataType, {
		id: "dataType",
		cell: (info) => info.getValue(),
		header: "Data type",
		footer: (props) => props.column.id,
	}),
	columnHelper.accessor((row) => row.place.region, {
		id: "region",
		cell: (info) => info.getValue(),
		header: "Region",
		footer: (props) => props.column.id,
	}),
	columnHelper.accessor((row) => row.place.settlement, {
		id: "settlement",
		cell: (info) => info.getValue(),
		header: "Settlement",
		footer: (props) => props.column.id,
	}),
]);

const tables = ref(null);
const columnFilters = ref<ColumnFiltersState>([]);

const registerTable = function (table: Table<Array<simpleTEIMetadata>>) {
	tables.value = table;
};

const setFilters = function (value: ColumnFiltersState) {
	columnFilters.value = value;
};
</script>

<template>
	<div v-if="simpleItems">
		<div class="flex justify-between py-2">
			<DataTableFilterTeiHeaders v-if="tables" :table="tables" :filters="columnFilters" />
			<DataTablePagination v-if="tables" :table="tables" />
		</div>
		<DataTable
			:items="simpleItems"
			:columns="columns"
			@click="openNewWindowFromAnchor"
			@table-ready="registerTable"
			@column-filters-change="setFilters"
		></DataTable>
		<div class="grid justify-items-end py-2">
			<DataTablePagination v-if="tables" :table="tables" />
		</div>
	</div>
</template>
