<script lang="ts" setup>
import {
	type ColumnDef,
	type ColumnFiltersState,
	createColumnHelper,
	type Table,
} from "@tanstack/vue-table";
import { h } from "vue";

import { useTEIHeaders } from "@/composables/use-tei-headers";
import type { DataTableWindowItem } from "@/types/global.d";
import type { simpleTEIMetadata } from "@/types/teiCorpus.d";

interface Props {
	params: DataTableWindowItem["params"];
}

const props = defineProps<Props>();

const { simpleItems } = useTEIHeaders();
const openNewWindowFromAnchor = useAnchorClickHandler();
const columnHelper = createColumnHelper<simpleTEIMetadata>();

const items = computed(() => {
	return simpleItems.value.filter((i) => props.params.dataTypes.includes(i.dataType));
});

const columns = ref([
	columnHelper.accessor((row) => row.person.name, {
		id: "label",
		cell: (info) => {
			const identifier =
				info.getValue() +
				(info.row.original.person.sex ? `/${info.row.original.person.sex}` : "") +
				(info.row.original.person.age ? `/${info.row.original.person.age}` : "");
			let linked_id: string | undefined = undefined;
			let linked_type: string | undefined = undefined;
			if (info.row.original.secondaryDataType === "Sample Text") {
				linked_type = "SampleText";
			} else if (info.row.original.secondaryDataType === "Feature List") {
				linked_type = "Feature";
			}

			if (linked_type) {
				linked_id = simpleItems.value.find((i) => {
					return i.dataType === linked_type && i.person.name === info.row.original.person.name;
				})?.id;
			}
			return linked_id
				? h(
						"a",
						{
							class: "underline color-primary",
							"data-target-type": linked_type,
							"data-text-id": linked_id,
						},
						identifier,
					)
				: identifier;
		},
		header: "Name",
		footer: (props) => props.column.id,
	}),
	columnHelper.accessor((row) => row.secondaryDataType, {
		id: "dataType",
		cell: (info) => {
			return info.getValue();
		},
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

	columnHelper.accessor((row) => row.recordingDate, {
		id: "date",
		cell: (info) => info.getValue(),
		header: "Recording date",
		footer: (props) => props.column.id,
	}),

	columnHelper.accessor((row) => row.resp, {
		id: "respPerson",
		cell: (info) => info.getValue(),
		header: "Interviewer",
		footer: (props) => props.column.id,
	}),
]);

const tables: Ref<Table<Array<simpleTEIMetadata>> | null> = ref(null);
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
			<DataTableFilterTeiHeaders v-if="tables" :filters="columnFilters" :table="tables" />
			<DataTablePagination v-if="tables" :table="tables as unknown as Table<never>" />
		</div>
		<DataTable
			:columns="columns as Array<ColumnDef<never>>"
			:items="items as Array<never>"
			@click="openNewWindowFromAnchor"
			@column-filters-change="setFilters"
			@table-ready="registerTable"
		></DataTable>
		<div class="grid justify-items-end py-2">
			<DataTablePagination v-if="tables" :table="tables as unknown as Table<never>" />
		</div>
	</div>
</template>
