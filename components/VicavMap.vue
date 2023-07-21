<script setup lang="ts">
import { Feature, GeoJsonObject, Geometry } from "geojson";
import L, {PointTuple} from "leaflet";

const emit = defineEmits<{
  (e: 'itemClicked', event: L.LeafletMouseEvent): void
}>()

const mapContainer = ref()
const regionMarker = {
  color: 'rgb(168, 93, 143)',
  weight: 1,
  fillColor: 'rgb(168, 93, 143)',
  radius: 10,
};
const placeMarker = {
  iconUrl: '/marker-icon.png',
  iconSize: [13, 35] as PointTuple,
  iconAnchor: [2, 35] as PointTuple,
}

let map: L.Map;
let geoJsonLayer: L.GeoJSON<any>;
onMounted(() => initMap())

const props = defineProps<{
  items: GeoJsonObject | GeoJsonObject[];
}>();

watch(() => props.items, () => placeGeoJson(props.items), { immediate: true })

async function initMap() {
  await nextTick();
  map = L.map(mapContainer.value);
  L.tileLayer(import.meta.env.VITE_MAP_TILELAYER as string, {
    maxZoom: 20,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  }).addTo(map);
  map.invalidateSize();
  setTimeout(function () { map.setView([import.meta.env.VITE_MAP_INITIAL_X, import.meta.env.VITE_MAP_INITIAL_Y], import.meta.env.VITE_MAP_INITIAL_Z) }, 50);
  placeGeoJson(props.items)
}

function placeGeoJson(items: GeoJsonObject | GeoJsonObject[]) {
  if (!map) return;
  if (!!geoJsonLayer) map.removeLayer(geoJsonLayer);

  geoJsonLayer = L.geoJSON(items, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      const iconMarker = L.icon(placeMarker);
      const markerProps: L.MarkerOptions = {
        alt: feature.properties.name,
        title: `${feature.properties.name} (${feature.properties.hitCount})`,
      }
      if(feature.properties.type === "reg") return L.circleMarker(latlng, Object.assign(markerProps, regionMarker));
      return L.marker(latlng, Object.assign( markerProps,{icon: iconMarker }));
    },
  });
  geoJsonLayer.addTo(map);
}

function onEachFeature(feature: Feature<Geometry, any>, layer: L.Layer) {
  layer.on({
    click: (e) => (emit('itemClicked', e)),
  });
}

</script>
<template>
  <div id="mapid" ref="mapContainer"></div>
</template>
