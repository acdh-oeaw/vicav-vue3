<script lang="ts" setup>
import type { Feature, Point } from "geojson";
import { computed, ref, useAttrs } from "vue";

import type { MarkerProperties } from "@/components/geo-map.context";
import DataTypes from "@/config/dataTypes.ts";
import type { DataTypesEnum } from "@/types/global";

const props = defineProps<{
	markers: Array<Feature<Point, MarkerProperties>>;
	groupMarkers: boolean;
	useCustomClickHandler?: boolean;
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
					BiblioEntries: [],
				};

			if (grouped[marker.properties.label] !== undefined) {
				const markerArray =
					grouped[marker.properties.label]![
						marker.properties.targetType as DataTypesEnum | "DataTable"
					];
				if (markerArray) {
					markerArray.push(marker);
				}
			}
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

const emit = defineEmits<{
	(event: "anchor-click", feature: Feature<Point, MarkerProperties>): void;
}>();
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
					<div v-if="markersOfType.length > 0">
						<h3 class="italic">
							{{ DataTypes[contentType as DataTypesEnum]?.contentTypeHeading ?? contentType }}
						</h3>

						<GeoMapPopupLinks
							:markers="markersOfType"
							:use-custom-click-handler="props.useCustomClickHandler"
							@anchor-click="(marker) => emit('anchor-click', marker)"
						/>
					</div>
				</div>
			</div>
		</template>
		<GeoMapPopupLinks
			v-if="!groupedMarkers"
			:markers="markers"
			:use-custom-click-handler="props.useCustomClickHandler"
			@anchor-click="(marker) => emit('anchor-click', marker)"
		/>
	</div>
</template>

<style lang="scss" module></style>
