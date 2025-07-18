<script setup lang="ts">
import type { Column } from "@tanstack/vue-table";
import { ChevronDown } from "lucide-vue-next";
import type { z } from "zod";

import type { GeojsonMapSchema } from "@/types/global";

interface Props {
	params: z.infer<typeof GeojsonMapSchema>["params"];
}
const props = defineProps<Props>();
const { params } = toRefs(props);

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);

const table = computed(() => tables.value.get(params.value.url));
const activeFeatures = computed(() =>
	table.value?.getVisibleLeafColumns().filter((col) => col.getCanHide()),
);
const activeRows = computed(() => table.value?.getFilteredRowModel().rows);
function getMatchingRowCount(columnId: string) {
	return activeRows.value?.filter((row) => (row.getValue(columnId) as Array<unknown>).length > 0)
		.length;
}
const collapsibleOpen = ref(true);

const { buildFeatureValueId } = useColorsStore();

type ColumnType = Column<
	{
		id: string;
		type: "Feature";
		geometry: { type: "Point"; coordinates: Array<number> };
		properties?: unknown;
	},
	unknown
>;

function getActiveFilterValues(feature: ColumnType) {
	return [...feature.getFacetedUniqueValues().entries()].filter(([value, _]) =>
		(feature.getFilterValue() as Map<string, number>).has(value),
	);
}

function getAllFacetsActive(feature: ColumnType) {
	for (const [facet, _] of feature.getFacetedUniqueValues()) {
		if (feature.getFilterValue() && !(feature.getFilterValue() as Map<string, number>).has(facet)) {
			return false;
		}
	}
	return true;
}

const { AND_OPERATOR } = useAdvancedQueries();
function getCombinedFilters(column: ColumnType) {
	if (!column.getFilterValue()) return [];
	return [...(column.getFilterValue() as Map<string, number>).keys()]
		.filter((filter) => filter.includes(AND_OPERATOR))
		.map((filter) => filter.split(AND_OPERATOR));
}
</script>

<template>
	<Collapsible v-model:open="collapsibleOpen">
		<div class="w-48 bg-white/80 p-3 text-xs">
			<CollapsibleTrigger class="flex w-full justify-between"
				><b>{{ activeRows?.length }} total markers</b
				><ChevronDown class="size-4" :class="collapsibleOpen ? '' : 'rotate-180'"></ChevronDown
			></CollapsibleTrigger>
			<CollapsibleContent>
				<div v-for="feature in activeFeatures" :key="feature.id" class="my-1">
					<div class="flex items-start gap-2">
						<svg
							v-if="getActiveFilterValues(feature).length === 0 || activeFeatures?.length === 1"
							class="mt-0.5 size-3.5 shrink-0"
						>
							<use
								v-if="activeFeatures!.length > 1"
								href="#petal"
								:style="{ fill: `var(--${feature.id})` }"
							></use>
							<circle v-else cx="8" cy="8" r="4" :style="{ fill: `var(--${feature.id})` }"></circle>
						</svg>
						<span>{{ feature.columnDef.header }} ({{ getMatchingRowCount(feature.id) }})</span>
					</div>
					<div
						v-for="filter in getCombinedFilters(feature)"
						:key="filter.join('')"
						class="ml-4 flex items-center gap-2"
					>
						<svg class="mt-0.5 size-3.5 shrink-0">
							<use
								href="#petal"
								:style="{
									fill: `var(--${buildFeatureValueId(feature.id, filter.join(AND_OPERATOR))})`,
								}"
							></use>
						</svg>
						<span>
							<span v-for="(fv, idx) in filter" :key="fv"
								>{{ fv
								}}<span v-if="idx < filter.length - 1" class="font-mono font-semibold"
									>&nbsp;and&nbsp;</span
								>
							</span>
						</span>
					</div>
					<div
						v-if="
							feature.getIsFiltered() && (feature.getFilterValue() as Map<string, number>).size > 0
						"
						class="ml-4"
					>
						<div
							v-for="[value, count] in getActiveFilterValues(feature)"
							:key="value"
							class="flex items-center gap-2"
						>
							<svg class="mt-0.5 size-3.5 shrink-0">
								<use
									href="#petal"
									:style="{ fill: `var(--${buildFeatureValueId(feature.id, value)})` }"
								></use>
							</svg>
							<span>{{ value }} ({{ count }})</span>
						</div>
						<div
							v-if="
								(feature.getFilterValue() as Map<string, number>).size > 0 &&
								!getAllFacetsActive(feature)
							"
							class="flex items-center gap-2"
						>
							<svg class="mt-0.5 size-3.5 shrink-0">
								<use
									href="#petal"
									:style="{
										fill: `var(--${feature.id})`,
										stroke: `var(--${feature.id})`,
										strokeWidth: '20px',
										fillOpacity: '0.2',
									}"
								></use>
							</svg>
							<span>Other feature values</span>
						</div>
					</div>
				</div></CollapsibleContent
			>
		</div>
	</Collapsible>
</template>
