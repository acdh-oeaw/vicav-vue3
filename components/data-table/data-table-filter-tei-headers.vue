<script setup lang="ts">
import type { ColumnFiltersState, Table } from "@tanstack/vue-table";

import type { simpleTEIMetadata } from "@/types/teiCorpus.d";

interface DataTableFilterProps {
	table: Table<Array<simpleTEIMetadata>>;
	filters: ColumnFiltersState;
	categories: Array<string>;
}

const props = defineProps<DataTableFilterProps>();
const { table, filters } = toRefs(props);

const sex: Ref<Array<string>> = ref(["m", "f"]);
const age: Ref<Array<number>> = ref([0, 100]);

const sexFilterValue = computed(() => {
	if (sex.value.length === 1) {
		return sex.value.at(0) ?? "__all__";
	}
	return "__all__";
});

const speakerFilter = computed(() => {
	return filters.value.find((filter) => filter.id === "name");
});

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

const setSpeakerFilter = function (event: Event) {
	setColumnFilter("name", (event.target as HTMLInputElement).value);
};

const setSexFilter = function () {
	setColumnFilter("sex", sexFilterValue.value);
};

const setAgeFilter = function (value: Array<number>) {
	setColumnFilter("age", value);
};

const setSettlementFilter = function (event: Event) {
	setColumnFilter("settlement", (event.target as HTMLInputElement).value);
};

const setRegionFilter = function (event: Event) {
	setColumnFilter("region", (event.target as HTMLInputElement).value);
};

const setColumnFilter = function (column: string, value: string | Array<number>) {
	const index = filters.value.findIndex((filter) => filter.id === column);

	if (index !== -1) {
		if (value === "__all__") filters.value.splice(index, 1);
		else if (filters.value[index]) filters.value[index].value = value;
	} else if (value !== "__all__") {
		filters.value.push({
			id: column,
			value: value,
		});
	}
	table.value.setColumnFilters(filters.value);
};

onMounted(() => {
	if (filters.value.length > 0)
		filters.value.forEach((filter) =>
			setColumnFilter(filter.id, filter.value as string | Array<number>),
		);
});

watch(
	() => filters.value,
	(newFilters, oldFilters) => {
		if (JSON.stringify(newFilters) !== JSON.stringify(oldFilters))
			newFilters.forEach((filter) =>
				setColumnFilter(filter.id, filter.value as string | Array<number>),
			);
	},
);
</script>

<template>
	<div class="flex flex-wrap justify-between px-2">
		<div class="flex items-center space-x-2">
			<div class="flex items-center space-x-2">
				<p id="dataTypeFilterSelect" class="whitespace-nowrap text-sm font-medium">Data type:</p>
				<Select
					aria-labelledby="dataTypeFilterSelect"
					:model-value="dataTypeFilter?.value as string"
					name="dataType"
					@update:model-value="setDataTypeFilter"
				>
					<SelectTrigger class="h-8 w-[70px]">
						<SelectValue placeholder="Select data type" />
					</SelectTrigger>
					<SelectContent class="bg-white">
						<SelectItem :key="-1" value="__all__">Select All</SelectItem>
						<SelectItem v-for="(dataType, index) in categories" :key="index" :value="`${dataType}`">
							{{ dataType }}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div class="flex items-center space-x-2">
				<label class="whitespace-nowrap text-sm font-medium" for="place">Place:</label>
				<input
					id="place"
					class="h-8 w-32 rounded-md border border-input"
					:value="settlementFilter?.value"
					@change="setSettlementFilter"
				/>
			</div>
			<div class="flex items-center space-x-2">
				<label class="whitespace-nowrap text-sm font-medium" for="region">Region:</label>
				<input
					id="region"
					class="h-8 w-32 rounded-md border border-input"
					:value="regionFilter?.value"
					@change="setRegionFilter"
				/>
			</div>
		</div>
		<div class="flex items-center space-x-2">
			<div class="flex items-center space-x-2">
				<label class="whitespace-nowrap text-sm font-medium" for="speaker">Speaker:</label>
				<input
					id="speaker"
					class="h-8 w-32 rounded-md border border-input"
					:value="speakerFilter?.value"
					@change="setSpeakerFilter"
				/>
			</div>

			<div class="flex items-center space-x-2">
				<p id="sexFilterSelect" class="whitespace-nowrap text-sm font-medium">Sex:</p>
				<SexFilter v-model="sex" @update:model-value="setSexFilter" />
			</div>
			<div class="flex items-center space-x-2">
				<p id="ageFilterSelect" class="whitespace-nowrap text-sm font-medium">Age:</p>
				<AgeFilter v-model="age" @update:model-value="setAgeFilter" />
			</div>
		</div>
	</div>
</template>
