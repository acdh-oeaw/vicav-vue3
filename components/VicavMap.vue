<script setup lang="ts">
import { Feature, GeoJsonObject, Geometry } from "geojson";
import L from "leaflet";


const emit = defineEmits<{
  (e: 'itemClicked', event: L.LeafletMouseEvent): void
}>()

const mapContainer = ref()
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
  L.tileLayer('https://api.mapbox.com/styles/v1/acetin/cjb22mkrf16qf2spyl3u1vee3/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWNldGluIiwiYSI6ImNqYjIybG5xdTI4OWYyd285dmsydGFkZWQifQ.xG4sN5u8h-BoXaej6OjkXw', {
    maxZoom: 20,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  }).addTo(map);
  map.invalidateSize();
  setTimeout(function () { map.setView([19.064, 24.544], 4) }, 50);
  placeGeoJson(props.items)
}

function placeGeoJson(items: GeoJsonObject | GeoJsonObject[]) {
  if (!map) return;
  if (!!geoJsonLayer) map.removeLayer(geoJsonLayer);
  const myCircleStyle = {
    color: "#000000",
    weight: 1,
    fillOpacity: 0.8,
    fillColor: "#007bd9",
    radius: 10,
  };

  geoJsonLayer = L.geoJSON(items, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, myCircleStyle);
    },
  });
  geoJsonLayer.addTo(map);

}

function onEachFeature(feature: Feature<Geometry, any>, layer: L.Layer) {
  //bind click
  layer.on({
    click: handleClick
  });
}

function handleClick(e: L.LeafletMouseEvent) {
  emit('itemClicked', e);
}

</script>
<template>
  <div id="mapid" ref="mapContainer"></div>
</template>
