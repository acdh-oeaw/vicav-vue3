<script lang="ts" setup>
import type { Feature, Point } from "geojson";
import { computed, ref, useAttrs } from "vue";

import type { MarkerProperties } from "@/components/geo-map.context";
import DataTypes from "@/config/dataTypes.ts";
import type { DataTypesEnum } from "@/types/global";

const props = defineProps<{
	markers: Array<Feature<Point, MarkerProperties>>;
	groupMarkers: boolean;
}>();
const attrs = useAttrs();
const $el = ref<HTMLElement>();

type LocationDataPoints = Record<
	DataTypesEnum | "DataTable",
	Array<Feature<Point, MarkerProperties>>
>;

const groupedMarkers = computed<Record<string, LocationDataPoints> | null>(() => {
	if (props.groupMarkers) {
		const grouped: Record<string, LocationDataPoints> = {};
		props.markers.forEach((marker) => {
			if (!grouped[marker.properties.label])
				grouped[marker.properties.label] = {
					Text: [],
					CorpusText: [],
					Feature: [],
					SampleText: [],
					Profile: [],
					DataTable: [],
				};

			grouped[marker.properties.label]![
				marker.properties.targetType as DataTypesEnum | "DataTable"
			].push(marker);
		});
		return grouped;
	} else {
		return null;
	}
});

defineExpose({
	$el,
	id: attrs.id,
});
</script>

<template>
	<div ref="$el">
		<template v-if="groupedMarkers">
			<div v-for="(markersGroupedByType, location) in groupedMarkers" :key="location" class="pb-2">
				<h2 class="text-base font-bold">
					{{ location }}
				</h2>
				<div
					v-for="(markersOfType, contentType) in markersGroupedByType"
					:key="contentType"
					class="text-xs"
				>
					<h3 v-if="markersOfType.length > 0" class="italic">
						{{ DataTypes[contentType as DataTypesEnum]?.contentTypeHeading ?? contentType }}
					</h3>

					<GeoMapPopupLinks :markers="markersOfType" />
				</div>
			</div>
		</template>
		<GeoMapPopupLinks v-if="!groupedMarkers" :markers="markers" />
	</div>
</template>

<style lang="scss" module></style>
