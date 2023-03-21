<script setup lang="ts">
import { VicavWinBox } from "~/components/VicavWinBox.client";
import { LMap, LMarker, LTileLayer, LFeatureGroup } from "@vue-leaflet/vue-leaflet";

const options = {
  x: 500,
  y: 200
}
</script>
<template>
  <client-only>
    <VicavWinBox :options="options">
      <div>this is some test content</div>
    </VicavWinBox>
  </client-only>
this is a test page
</template>
