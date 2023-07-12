<script setup lang="ts">
import VicavMap from "./VicavMap.vue";
function MapClick(myDocumentXml: string) {
  console.log("[not implemented] MapClick", myDocumentXml);
}
</script>

<template>
  <div id="vv-map-container">
    <div id="vv-map-controls">Here come the map controls</div>
    <vicav-map id="vv-map" input="MapClick" :items="[]"/>
  </div>
</template>

<style lang="scss" scoped>
#vv-map-container {
	height: 100%;
	width: 100%;
	display: flex;
	flex-flow: column;
	align-items: stretch;
}
#vv-map-controls {
  height: 25px;
}

#vv-map {
  position: absolute;
  top: 25px;
  bottom: 0;
  width: 100%;
}
</style>
