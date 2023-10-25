<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";
import type { Feature, Point } from "geojson";
import {
	circleMarker,
	geoJSON,
	type Map as LeafletMap,
	map as createMap,
	marker,
	tileLayer,
} from "leaflet";

import { type GeoMapContext, key, type MarkerProperties } from "@/components/geo-map.context";

interface Props {
	height: number;
	markers: Array<Feature<Point, MarkerProperties>>;
	width: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	(event: "ready", map: LeafletMap): void;
	(event: "marker-click", feature: Feature<Point>): void;
}>();

const { data: config } = useGeoMapConfig();

const elementRef = ref<HTMLDivElement | null>(null);

const context: GeoMapContext = {
	map: null,
	baseLayer: null,
	featureGroups: {
		markers: null,
	},
};

function updateMarkers() {
	const featureGroup = context.featureGroups.markers;

	if (featureGroup == null) return;

	featureGroup.clearLayers();

	props.markers.forEach((marker) => {
		featureGroup.addData(marker);
	});
}

onMounted(async () => {
	/**
	 * @see https://github.com/nuxt/nuxt/issues/13471
	 * @see https://github.com/vuejs/core/issues/5844
	 */
	await nextTick();

	if (elementRef.value == null) return;

	context.map = createMap(elementRef.value, config.options).setView(
		config.initialViewState.center,
		config.initialViewState.zoom,
	);

	context.baseLayer = tileLayer(config.baseLayer.url, {
		attribution: config.baseLayer.attribution,
	}).addTo(context.map);

	context.featureGroups.markers = geoJSON<MarkerProperties, Point>(undefined, {
		onEachFeature(feature, layer) {
			const tooltipContent = `${feature.properties.name} (${feature.properties.hitCount})`;

			layer.bindTooltip(tooltipContent, {
				permanent: false,
				sticky: true,
			});

			layer.on({
				click() {
					emit("marker-click", feature);
				},
			});
		},
		pointToLayer(feature, latlng) {
			if (feature.properties.type === "reg") {
				return circleMarker(latlng, config.marker.region);
			}

			return marker(latlng, config.marker.place);
		},
	}).addTo(context.map);

	updateMarkers();
});

watch(() => {
	return props.markers;
}, updateMarkers);

const resize = debounce(() => {
	void nextTick(() => {
		context.map?.invalidateSize();
	});
}, 150);

watch(
	[
		() => {
			return props.width;
		},
		() => {
			return props.height;
		},
	],
	resize,
);

onUnmounted(() => {
	context.map?.remove();
});

// defineExpose(context);

provide(key, context);
</script>

<template>
	<div ref="elementRef" class="absolute inset-0 grid" data-geo-map />
	<slot :context="context" />
</template>

<style>
.leaflet-container {
	isolation: isolate;
}

.leaflet-container:focus {
	outline: none;
}

/** Fix a11y issues. */
.leaflet-control-attribution a {
	color: inherit;
	text-decoration: underline;
	text-underline-offset: 0.1em;
}
</style>
