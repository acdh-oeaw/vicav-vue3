<script lang="ts" setup>
import type { Feature, Point } from "geojson";
import { computed, ref, useAttrs } from "vue";

import type { MarkerProperties } from "@/components/geo-map.context";

const props = defineProps<{
	markers: Array<Feature<MarkerProperties, Point>>;
	groupMarkers: boolean;
}>();
const attrs = useAttrs();
const contentTypeHeadings = {
	Profile: "Profiles",
	Feature: "Feature lists",
	SampleText: "Sample texts",
	CorpusText: "Corpus texts",
};

const $el = ref<HTMLElement>();

interface LocationDataPoints {
	Feature: Array<Feature<Point, MarkerProperties>>;
	Profile: Array<Feature<Point, MarkerProperties>>;
	SampleText: Array<Feature<Point, MarkerProperties>>;
	CorpusText: Array<Feature<Point, MarkerProperties>>;
}

const groupedMarkers = computed<Record<string, LocationDataPoints> | null>(() => {
	if (props.groupMarkers) {
		let grouped = {};
		props.markers.forEach((marker) => {
			if (grouped[marker.properties.label] === undefined)
				grouped[marker.properties.label] = { Profile: [], Feature: [], Sample: [] };
			grouped[marker.properties.label][marker.properties.targetType].push(marker);
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
						{{ contentTypeHeadings[contentType] }}
					</h3>

					<GeoMapPopupLinks :markers="markersOfType" />
				</div>
			</div>
		</template>
		<GeoMapPopupLinks v-if="!groupedMarkers" :markers="markers" />
	</div>
</template>

<style lang="scss" module></style>
