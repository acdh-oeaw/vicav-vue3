<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";
import type { Feature, Point } from "geojson";
import {
	circleMarker,
	geoJSON,
	type Map as LeafletMap,
	map as createMap,
	type Marker as LeafletMarker,
	marker,
	type Point as LeafletPoint,
	tileLayer,
} from "leaflet";

import { type GeoMapContext, key, type MarkerProperties } from "@/components/geo-map.context";
import GeoMapPopupContent from "@/components/geo-map-popup-content.vue";

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

interface ComponentPopupInfo {
	id: string;
	props: {
		markers: Array<Feature<Point, MarkerProperties>>;
		groupMarkers: boolean;
	};
}

const popupElements = ref<Array<GeoMapPopupContent>>([]);
const componentPopups = ref<Array<ComponentPopupInfo>>([]);
const openedPopupId = ref<number | null>(null);
const elementRef = ref<HTMLElement | null>(null);

watchEffect(() => {
	componentPopups.value.forEach((popup) => {
		const element = popupElements.value.find((popupElement) => popup.id === popupElement.id);
		const leafletMarker = context.featureGroups.markers?.getLayer(popup.id as number);
		if (leafletMarker == null || element == null) return;

		leafletMarker.bindPopup(element.$el, { minWidth: 150 });
	});
});

const context: GeoMapContext = {
	map: null,
	baseLayer: null,
	featureGroups: {
		markers: null,
	},
};

const ptDistanceSq = function (pt1: LeafletPoint, pt2: LeafletPoint): number {
	let dx = pt1.x - pt2.x;
	let dy = pt1.y - pt2.y;
	return dx * dx + dy * dy;
};

// Bind a popup listing nearby data to markers close to each other.
// Remove existing if there are no nearby markers on the map any more.
const addNearbyDataPopup = function (marker) {
	const featureGroup = context.featureGroups.markers;
	const map = context.map;
	if (featureGroup === null || map === null) return;

	let distance = Math.floor(2 * map.getZoom());
	let nearbyMarkerData = [];
	const pxSq = distance * distance;
	const markerPt = map.latLngToLayerPoint(marker.getLatLng());

	const id = featureGroup.getLayerId(marker);
	Object.values(featureGroup.getLayers()).forEach((m: LeafletMarker) => {
		if (map.hasLayer(m)) {
			const mPt = map.latLngToLayerPoint(m.getLatLng());
			if (ptDistanceSq(mPt, markerPt) < pxSq) {
				nearbyMarkerData.push(m.feature);
			}
		}
	});

	if (nearbyMarkerData.length > 1) {
		const markers = nearbyMarkerData.sort((a, b) => {
			return a.properties.label.localeCompare(b.properties.label);
		});

		// @todo determine whether grouping is needed based on the number of
		// feature groups once separate feature groups for queries are supported.
		let contentTypes = [];
		markers.forEach((marker) => {
			if (!contentTypes.includes(marker.properties.targetType)) {
				contentTypes.push(marker.properties.targetType);
			}
		});

		componentPopups.value.push({
			id: id as string,
			props: {
				markers: markers,
				groupMarkers: contentTypes.length > 1,
			},
		});
	} else if (marker.getPopup()) {
		console.log(marker);
		marker.removePopup();
	}
};

function updateMarkers(updateViewport = true) {
	const featureGroup = context.featureGroups.markers;

	if (featureGroup == null) return;

	featureGroup.clearLayers();

	props.markers.forEach((marker) => {
		featureGroup.addData(marker);
	});

	if (config.nearbyMarkersPopup) {
		Object.values(featureGroup.getLayers()).forEach((marker) => {
			addNearbyDataPopup(marker);
		});
	}

	if (updateViewport) fitAllMarkersOnViewport();
}

function fitAllMarkersOnViewport() {
	if (context.featureGroups.markers !== null) {
		let boundingBox = context.featureGroups.markers.getBounds();
		if (typeof boundingBox === "object" && Object.keys(boundingBox).length > 0) {
			context.map?.fitBounds(boundingBox, { animate: false });
		}
	}
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
					const id = context.featureGroups.markers?.getLayerId(layer);
					if (layer.getPopup()) {
						openedPopupId.value = id ? id : null;
					} else {
						emit("marker-click", feature);
					}
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
	context.map.on("zoomend", function () {
		updateMarkers(false);
	});
});

// noinspection TypeScriptValidateTypes
watch(() => props.markers, updateMarkers);

const resize = debounce(() => {
	if (context.map === null) {
		return;
	}
	let previousBoundingBox = context.map.getBounds();
	void nextTick(() => {
		context.map?.invalidateSize();
		let featureMarkerBounds = context.featureGroups.markers?.getBounds();
		let isAllMarkersInView =
			featureMarkerBounds === undefined || Object.keys(featureMarkerBounds).length === 0
				? false
				: previousBoundingBox.contains(featureMarkerBounds);
		if (isAllMarkersInView) {
			fitAllMarkersOnViewport();
		} else {
			context.map?.fitBounds(previousBoundingBox, { animate: false });
		}
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
	<GeoMapPopupContent
		v-for="popupInfo in componentPopups"
		v-show="popupInfo.id == openedPopupId"
		v-bind="popupInfo.props"
		:id="popupInfo.id"
		:key="popupInfo.id"
		ref="popupElements"
	/>
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
