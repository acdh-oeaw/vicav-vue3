<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";
import type { Feature, Point } from "geojson";
import {
	circleMarker,
	geoJSON,
	latLng,
	type Map as LeafletMap,
	map as createMap,
	type Marker as LeafletMarker,
	marker,
	type Point as LeafletPoint,
	tileLayer,
} from "leaflet";

import { type GeoMapContext, key, type MarkerProperties } from "@/components/geo-map.context";
import GeoMapPopupContent from "@/components/geo-map-popup-content.vue";
import type { MarkerType } from "@/types/global";

interface Props {
	height: number;
	markers: Array<Feature<Point, MarkerProperties>>;
	width: number;
	markerType?: MarkerType;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	(event: "ready", map: LeafletMap): void;
	(event: "marker-click", feature: Feature<Point, MarkerProperties>): void;
}>();

const { data: config } = useGeoMapConfig();

interface ComponentPopupInfo {
	id: string;
	props: {
		markers: Array<Feature<Point, MarkerProperties>>;
		groupMarkers: boolean;
	};
}

const popupElements = ref<Map<string, globalThis.ComponentPublicInstance>>(new Map());
const componentPopups = ref<Array<ComponentPopupInfo>>([]);
const openedPopupId = ref<number | null>(null);
const elementRef = ref<HTMLElement | null>(null);

watchEffect(() => {
	componentPopups.value.forEach((popup) => {
		const element = popupElements.value.get(popup.id);
		const leafletMarker = context.featureGroups.markers?.getLayer(parseInt(popup.id));
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
	const dx = pt1.x - pt2.x;
	const dy = pt1.y - pt2.y;
	return dx * dx + dy * dy;
};

function getGridCell(lat: number, long: number) {
	// Divides the map into a grid based on the current zoom level.
	// The grid size is 45 degrees at zoom level 1 and halves with each zoom level.
	// To reduce the number of computations per marker, reduce the base size (currently 45).
	const gridSize = 45 / Math.pow(2, context.map?.getZoom() ?? 1);
	return {
		long: Math.floor(long / gridSize),
		lat: Math.floor(lat / gridSize),
	};
}

function updateDynamicGrid() {
	const markerGrid: Record<number, Record<number, Array<Feature<Point, MarkerProperties>>>> = {};
	const markers = Object.values(props.markers);

	markers.forEach((marker) => {
		if (!marker.geometry?.coordinates || marker.geometry.coordinates.length < 2) {
			return;
		}
		const cell = getGridCell(marker.geometry.coordinates[1]!, marker.geometry.coordinates[0]!);
		if (!markerGrid[cell.lat]) {
			markerGrid[cell.lat] = {};
		}
		if (!markerGrid[cell.lat]![cell.long]) {
			markerGrid[cell.lat]![cell.long] = [];
		}
		markerGrid[cell.lat]![cell.long]!.push(marker);
	});

	dynamicMarkerGrid.value = markerGrid;
}

const dynamicMarkerGrid = ref<
	Record<number, Record<number, Array<Feature<Point, MarkerProperties>>>>
>({});

function getNearbyMarkersBasedOnDynamicGrid(
	marker: LeafletMarker,
	distance: number,
): Array<Feature> {
	if (context.map === null) return [];
	const { lat, long } = getGridCell(
		marker.feature?.geometry.coordinates[1] ?? 0,
		marker.feature?.geometry.coordinates[0] ?? 0,
	);
	const nearbyMarkers: Array<Feature> = [];
	const pxSq = distance * distance;
	const markerPt = context.map.latLngToLayerPoint(marker.getLatLng());

	for (let i = lat - 1; i <= lat + 1; i++) {
		for (let j = long - 1; j <= long + 1; j++) {
			if (dynamicMarkerGrid.value[i] && dynamicMarkerGrid.value[i]![j]) {
				dynamicMarkerGrid.value[i]![j]?.forEach((m) => {
					const mPt = context.map!.latLngToLayerPoint(
						latLng(m.geometry.coordinates[1]!, m.geometry.coordinates[0]!),
					);
					if (ptDistanceSq(mPt, markerPt) < pxSq) {
						nearbyMarkers.push(m);
					}
				});
			} else {
				if (lat === i && long === j)
					console.warn(
						"No grid entry found for marker",
						marker,
						{ lat, long },
						dynamicMarkerGrid.value[i],
					);
			}
		}
	}
	return nearbyMarkers;
}

// Bind a popup listing nearby data to markers close to each other.
// Remove existing if there are no nearby markers on the map any more.
const addNearbyDataPopup = function (marker: LeafletMarker) {
	const featureGroup = context.featureGroups.markers;
	const map = context.map;
	if (
		featureGroup === null ||
		map === null ||
		marker.feature!.properties!.targetType === null ||
		marker.feature!.properties!.targetType === "" ||
		marker.feature!.properties!.targetId
	)
		return;

	const distance = Math.floor(2 * map.getZoom());
	const id = featureGroup.getLayerId(marker);
	const nearbyMarkerData = getNearbyMarkersBasedOnDynamicGrid(marker, distance);

	if (nearbyMarkerData.length > 1) {
		const markers = nearbyMarkerData.sort((a, b) => {
			return a.properties!.label?.localeCompare(b.properties!.label);
		});

		// @todo determine whether grouping is needed based on the number of
		// feature groups once separate feature groups for queries are supported.
		const contentTypes: Array<string> = [];
		markers.forEach((marker) => {
			if (!contentTypes.includes(marker.properties!.targetType)) {
				contentTypes.push(marker.properties!.targetType);
			}
		});

		componentPopups.value.push({
			id: id.toString(),
			props: {
				markers: markers as Array<Feature<Point, MarkerProperties>>,
				groupMarkers: contentTypes.length > 1,
			},
		});
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
		updateDynamicGrid();
		Object.values(featureGroup.getLayers()).forEach((marker) => {
			addNearbyDataPopup(marker as LeafletMarker);
		});
	}

	if (updateViewport) fitAllMarkersOnViewport();
}

function fitAllMarkersOnViewport() {
	if (context.featureGroups.markers !== null) {
		const boundingBox = context.featureGroups.markers.getBounds();
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
			if (props.markerType === "petal") return usePetalMarker(feature, latlng);
			if (feature.properties.type === "reg") {
				return circleMarker(latlng, config.marker.region);
			}

			return marker(latlng, config.marker.place);
		},
	}).addTo(context.map);

	updateMarkers();
	context.map.on("zoomend", () => {
		updateMarkers(false);
	});
});

watch(
	() => props.markers,
	() => updateMarkers(),
);

const resize = debounce(() => {
	if (context.map === null) {
		return;
	}
	const previousBoundingBox = context.map.getBounds();
	void nextTick(() => {
		context.map?.invalidateSize();
		const featureMarkerBounds = context.featureGroups.markers?.getBounds();
		const isAllMarkersInView =
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
	<SvgoPetal v-if="props.markerType === 'petal'" />
	<div ref="elementRef" class="absolute inset-0 grid" data-geo-map />
	<slot :context="context" />
	<GeoMapPopupContent
		v-for="popupInfo in componentPopups"
		v-show="popupInfo.id === openedPopupId?.toString()"
		v-bind="popupInfo.props"
		:id="popupInfo.id"
		:key="popupInfo.id"
		:ref="
			(el) => {
				if (el) popupElements.set(popupInfo.id, el as globalThis.ComponentPublicInstance);
			}
		"
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
