<script setup lang="ts">
import type { ColumnFiltersState, Table } from "@tanstack/vue-table";

interface DataTableFilterProps {
	table: Table<SimpleTEIHeader>;
	filters: ColumnFiltersState;
}
const props = defineProps<DataTableFilterProps>();
const { table, filters } = toRefs(props);

const dataTypeFilter = computed(() => {
	return filters.value.find((filter) => filter.id === "dataType");
});

const settlementFilter = computed(() => {
	return filters.value.find((filter) => filter.id === "settlement");
});

const regionFilter = computed(() => {
	return filters.value.find((filter) => filter.id === "region");
});

const setDataTypeFilter = function (value: string) {
	setColumnFilter("dataType", value);
};

const setSettlementFilter = function (event: Event) {
	setColumnFilter("settlement", event.target?.value);
};

const setColumnFilter = function (column: string, value: string) {
	const index = filters.value.findIndex((filter) => filter.id === column);
	if (index !== -1) {
		filters.value[index].value = value;
	} else {
		filters.value.push({
			id: column,
			value: value,
		});
	}
	table.value.setColumnFilters(filters.value);
};
</script>

<template>
	<div class="flex items-center justify-between px-2">
		<div class="flex items-center space-x-6 lg:space-x-8">
			<div class="flex items-center space-x-2">
				<p id="dataTypeFilterSelect" class="whitespace-nowrap text-sm font-medium">Data type:</p>
				<Select
					aria-labelledby="dataTypeFilterSelect"
					:model-value="dataTypeFilter?.value"
					name="dataType"
					@update:model-value="setDataTypeFilter"
				>
					<SelectTrigger class="h-8 w-[70px]">
						<SelectValue placeholder="Select data type" />
					</SelectTrigger>
					<SelectContent class="bg-white">
						<SelectItem
							v-for="(dataType, index) in [
								'Feature List',
								'Sample Text',
								'Free Speech',
								'Tunocent Questionnaire',
								'WAD Questionnaire',
							]"
							:key="index"
							:value="`${dataType}`"
						>
							{{ dataType }}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div class="flex items-center space-x-2">
				<p id="settlement" class="whitespace-nowrap text-sm font-medium">Place:</p>
				<Input
					class="h-8 rounded-md border border-input"
					:value="settlementFilter?.value"
					@change="setSettlementFilter"
				/>
			</div>
			<div class="flex items-center space-x-2">
				<p id="settlement" class="whitespace-nowrap text-sm font-medium">Region:</p>
				<Input
					class="h-8 rounded-md border border-input"
					:value="regionFilter?.value"
					@change="setRegionFilter"
				/>
			</div>
		</div>
	</div>
</template>
