<script lang="ts" setup>
import {
	type ColumnDef,
	type ColumnFiltersState,
	createColumnHelper,
	type Table,
} from "@tanstack/vue-table";
import { Volume2, VolumeX } from "lucide-vue-next";
import { h } from "vue";

import { useTEIHeaders } from "@/composables/use-tei-headers";
import type { DataTableWindowItem } from "@/types/global.d";
import type { simpleTEIMetadata } from "@/types/teiCorpus.d";

interface Props {
	params: DataTableWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { simpleItems } = useTEIHeaders();
const openNewWindowFromAnchor = useAnchorClickHandler();
const columnHelper = createColumnHelper<simpleTEIMetadata>();
const items = computed(() => {
	return simpleItems.value.filter((i) => props.params.dataTypes.includes(i.dataType));
});

const categories = [
	...new Set(items.value.map((i) => i.category).filter((category) => category !== "")),
];

const columns = ref([
	columnHelper.accessor((row) => row.label, {
		id: "label",
		cell: (info) => {
			let linked_id: string | undefined = undefined;
			let linked_type: string | undefined = undefined;
			if (info.row.original.category === "VICAV Sample Texts") {
				linked_type = "SampleText";
			} else if (info.row.original.category === "VICAV Feature List") {
				linked_type = "Feature";
			}

			if (linked_type) {
				linked_id = simpleItems.value.find((i) => {
					return (
						i.dataType === linked_type &&
						i.person.at(0)?.name === info.row.original.person.at(0)?.name
					);
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
						info.getValue(),
					)
				: info.getValue();
		},
		header: "Title",
		footer: (props) => props.column.id,
	}),
	columnHelper.accessor((row) => row.person.map((p) => p.name).join(", "), {
		id: "name",
		cell: (info) => info.getValue(),
		header: "Speakers",
		footer: (props) => props.column.id,
	}),
	columnHelper.accessor((row) => row.person.at(0)?.age, {
		id: "age",
		cell: (info) => info.getValue(),
		header: "Age",
		footer: (props) => props.column.id,
		filterFn: "inNumberRange",
	}),
	columnHelper.accessor((row) => row.person.at(0)?.sex, {
		id: "sex",
		cell: (info) => info.getValue(),
		header: "Sex",
		footer: (props) => props.column.id,
	}),

	columnHelper.accessor((row) => row.category, {
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
		header: "Location",
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

	columnHelper.accessor((row) => row.duration, {
		id: "duration",
		cell: (info) => info.getValue(),
		header: "Duration",
		footer: (props) => props.column.id,
	}),

	columnHelper.accessor((row) => row.audioAvailability, {
		id: "audioAvailability",
		cell: (info) =>
			info.getValue() === "free"
				? h(Volume2, { title: info.getValue() })
				: h(VolumeX, { title: info.getValue() }),
		header: "Avaiilability",
		footer: (props) => props.column.id,
	}),
]);

const tables: Ref<Table<Array<simpleTEIMetadata>> | null> = ref(null);
const columnFilters = ref<ColumnFiltersState>(
	props.params.filters ? props.params.filters.map((f) => ({ id: f.key, value: f.value })) : [],
);

watch(
	() => params.value.filters,
	() => {
		if (!params.value.filters) return;
		columnFilters.value = params.value.filters.map((f) => ({ id: f.key, value: f.value }));
	},
);

const registerTable = function (table: Table<Array<simpleTEIMetadata>>) {
	tables.value = table;
};

const setFilters = function (value: ColumnFiltersState) {
	columnFilters.value = value;
};
</script>

<template>
	<div v-if="simpleItems">
		<div class="flex flex-wrap justify-between py-2">
			<DataTableFilterTeiHeaders
				v-if="tables"
				:categories="categories"
				:filters="columnFilters"
				rows=""
				:table="tables"
			/>
			<DataTablePagination v-if="tables" :table="tables as unknown as Table<never>" />
			<div>{{ tables?.getFilteredRowModel().rows.length }} results</div>
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
