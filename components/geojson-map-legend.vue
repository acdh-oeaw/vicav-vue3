<script setup lang="ts">
import type { Column } from "@tanstack/vue-table";
import { ChevronDown } from "lucide-vue-next";
import type Zod from "zod";

import type { GeojsonMapSchema } from "@/types/global";

import type { SelectionEntry } from "./marker-selector.vue";

const { getMarkerSVG, getCircleSVG } = usePetalMarker();

interface Props {
	params: Zod.infer<typeof GeojsonMapSchema>["params"];
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

const { buildFeatureValueId, setMarker } = useMarkerStore();
const { markerSettings, markers } = storeToRefs(useMarkerStore());

type ColumnType = Column<
	{
		id: string;
		type: "Feature";
		geometry: { type: "Point"; coordinates: Array<number> };
		properties: unknown;
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
function updateMarker(markerSelection: SelectionEntry) {
	setMarker(markerSelection);
}
</script>

<template>
	<Collapsible v-model:open="collapsibleOpen" class="w-48 bg-white/80 p-3 text-xs flex flex-col">
		<CollapsibleTrigger class="flex w-full justify-between"
			><b>{{ activeRows?.length }} total markers</b
			><ChevronDown class="size-4" :class="collapsibleOpen ? '' : 'rotate-180'"></ChevronDown
		></CollapsibleTrigger>
		<CollapsibleContent class="max-h-full !overflow-auto">
			<div v-for="feature in activeFeatures" :key="feature.id" class="my-1">
				<div class="flex items-start gap-2">
					<svg
						v-if="activeFeatures?.length === 1 && markerSettings.showCenter"
						class="mt-0.5 size-3.5 shrink-0"
						view-box="0 0 18 18 "
						v-html="getCircleSVG(`var(--${feature.id})`, true, 14).outerHTML"
					></svg>
					<MarkerSelector
						v-else-if="getActiveFilterValues(feature).length === 0"
						:icon-categories="['shapes']"
						:model-value="markers.get(feature.id)!"
						:use-popover-portal="true"
						@update:model-value="(props) => updateMarker(props)"
					></MarkerSelector>
					<span>{{ feature.columnDef.header }} ({{ getMatchingRowCount(feature.id) }})</span>
				</div>
				<div
					v-for="filter in getCombinedFilters(feature)"
					:key="filter.join('')"
					class="ml-4 flex items-center gap-2"
				>
					<MarkerSelector
						:icon-categories="['shapes']"
						:model-value="markers.get(buildFeatureValueId(feature.id, filter.join(AND_OPERATOR)))!"
						:use-popover-portal="true"
						@update:model-value="(props) => updateMarker(props)"
					></MarkerSelector>
					<!-- <svg
							class="mt-0.5 size-3.5 shrink-0"
							v-html="
								getMarkerSVG({ id: buildFeatureValueId(feature.id, filter.join(AND_OPERATOR)) })
									.outerHTML
							"
						></svg> -->
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
						<MarkerSelector
							:icon-categories="['shapes']"
							:model-value="markers.get(buildFeatureValueId(feature.id, value))!"
							:use-popover-portal="true"
							@update:model-value="(props) => updateMarker(props)"
						></MarkerSelector>
						<!-- <svg
								class="mt-0.5 size-3.5 shrink-0"
								v-html="getMarkerSVG({ id: buildFeatureValueId(feature.id, value) }).outerHTML"
							></svg> -->
						<span>{{ value }} ({{ count }})</span>
					</div>
					<div
						v-if="
							(feature.getFilterValue() as Map<string, number>).size > 0 &&
							!getAllFacetsActive(feature) &&
							markerSettings.showOtherFeatureValues
						"
						class="flex items-center gap-2"
					>
						<svg
							class="mt-0.5 size-3.5 shrink-0"
							v-html="getMarkerSVG({ id: feature.id, strokeOnly: true }).outerHTML"
						></svg>
						<span>Other feature values</span>
					</div>
				</div>
			</div>
		</CollapsibleContent>
	</Collapsible>
</template>
