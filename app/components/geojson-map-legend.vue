<script setup lang="ts">
import type { Column } from "@tanstack/vue-table";
import { ChevronDown } from "lucide-vue-next";
import type Zod from "zod";

import type { GeojsonMapSchema } from "@/types/global.ts";
import { ensureFilterValueMap } from "@/utils/filter-value-map";

import type { SelectionEntry } from "./marker-selector.vue";

const { getMarkerSVG } = usePetalMarker();

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
	const filterValue = ensureFilterValueMap(feature.getFilterValue());
	return [...feature.getFacetedUniqueValues().entries()].filter(([value, _]) =>
		filterValue.has(value),
	);
}

function getAllFacetsActive(feature: ColumnType) {
	const filterValue = ensureFilterValueMap(feature.getFilterValue());
	for (const [facet, _] of feature.getFacetedUniqueValues()) {
		if (feature.getFilterValue() && !filterValue.has(facet)) {
			return false;
		}
	}
	return true;
}

const { AND_OPERATOR } = useAdvancedQueries();
function getCombinedFilters(column: ColumnType) {
	if (!column.getFilterValue()) return [];
	const filterValue = ensureFilterValueMap(column.getFilterValue());
	return [...filterValue.keys()]
		.filter((filter) => filter.includes(AND_OPERATOR))
		.map((filter) => filter.split(AND_OPERATOR));
}
function hasActiveFilters(column: ColumnType) {
	const filterValue = ensureFilterValueMap(column.getFilterValue());
	return filterValue.size > 0 || filterValue.exclude.size > 0;
}
function updateMarker(markerSelection: SelectionEntry) {
	setMarker(markerSelection);
}
function isMarkerHidden(id: string) {
	return markers.value.get(id)?.hidden ?? false;
}
function shouldShowOtherFeatureValues(feature: ColumnType) {
	return (
		hasActiveFilters(feature) &&
		!getAllFacetsActive(feature) &&
		markerSettings.value.showOtherFeatureValues
	);
}
</script>

<template>
	<Collapsible
		v-model:open="collapsibleOpen"
		class="flex h-fit w-56 flex-col bg-white p-4 text-xs"
		data-geo-map-legend
	>
		<CollapsibleTrigger class="flex w-full justify-between"
			><span class="font-medium">{{ activeRows?.length }} total markers</span
			><ChevronDown
				class="size-4 text-on-muted"
				:class="collapsibleOpen ? '' : 'rotate-180'"
			></ChevronDown
		></CollapsibleTrigger>
		<CollapsibleContent
			class="max-h-full !overflow-auto border-muted"
			:class="{ 'mt-2 border-t pt-1': activeFeatures?.length }"
		>
			<div v-for="feature in activeFeatures" :key="feature.id" class="my-1">
				<div
					class="my-2 flex items-start gap-2"
					:class="{ 'opacity-45': isMarkerHidden(feature.id) }"
				>
					<MarkerSelector
						:icon-categories="['shapes']"
						:model-value="markers.get(feature.id)!"
						:use-popover-portal="true"
						@update:model-value="(props) => updateMarker(props)"
					></MarkerSelector>
					<span>{{ feature.columnDef.header }} ({{ getMatchingRowCount(feature.id) }})</span>
				</div>
				<div
					v-for="filter in getCombinedFilters(feature)"
					:key="filter.join(AND_OPERATOR)"
					class="ml-5 flex items-center gap-2"
					:class="{
						'opacity-45': isMarkerHidden(
							buildFeatureValueId(feature.id, filter.join(AND_OPERATOR)),
						),
					}"
				>
					<MarkerSelector
						:icon-categories="['shapes']"
						:model-value="markers.get(buildFeatureValueId(feature.id, filter.join(AND_OPERATOR)))!"
						:use-popover-portal="true"
						@update:model-value="(props) => updateMarker(props)"
					></MarkerSelector>
					<span>
						<span v-for="(fv, idx) in filter" :key="fv"
							>{{ fv
							}}<span v-if="idx < filter.length - 1" class="font-mono font-semibold"
								>&nbsp;and&nbsp;</span
							>
						</span>
					</span>
				</div>
				<div v-if="feature.getIsFiltered() && hasActiveFilters(feature)" class="ml-5">
					<div
						v-for="[value, count] in getActiveFilterValues(feature)"
						:key="value"
						class="my-1 flex items-center gap-2"
						:class="{ 'opacity-45': isMarkerHidden(buildFeatureValueId(feature.id, value)) }"
					>
						<MarkerSelector
							:icon-categories="['shapes']"
							:model-value="markers.get(buildFeatureValueId(feature.id, value))!"
							:use-popover-portal="true"
							@update:model-value="(props) => updateMarker(props)"
						></MarkerSelector>
						<span>{{ value }} ({{ count }})</span>
					</div>
					<div
						v-if="shouldShowOtherFeatureValues(feature)"
						class="flex items-center gap-2"
						:class="{ 'opacity-45': isMarkerHidden(feature.id) }"
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
