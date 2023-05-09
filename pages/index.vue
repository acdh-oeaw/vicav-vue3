<script setup lang="ts">
import { GeoJsonObject } from 'geojson'
import { z } from "zod";
const { $api } = useNuxtApp();

const pointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.array(z.number()),
  bbox: z.array(z.number()).optional()
})

const featureSchema = z.object({
  type: z.literal("Feature"),
  id: z.union([z.number(), z.string()]).optional(),
  properties: z.any().nullable(),
  geometry: pointSchema.nullable()
})

$api.baseUrl = "https://vicav.acdh-ch-dev.oeaw.ac.at/vicav";
$api.project.getProject({ headers: { accept: "application/json" }});
const { data, pending, error, refresh } = await useAsyncData(
    () => $api.biblMarkersTei.getMarkers({query: ".*", scope: "geo"}, { headers: { accept: "application/json" }}),
    {
      transform: (items) => items.data.map(feature => {
        const coordinates = feature.geometry.coordinates.map(coord => parseFloat(coord)).reverse();
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates
          }
        };
      })
      .filter((item) => {
        try {
          featureSchema.parse(item);
          return true
        } catch (error) {
          console.log(error,item);
          return false
        }
      })
    },
)
onMounted(() => {
  refresh()
})
const items = computed(() => data?.value || [])
</script>

<template>
    <client-only>
        <MenuBar/>
        <div style="position:relative; overflow: hidden;">
          <WindowManager/>
          <vicav-map :items="items as GeoJsonObject[]" style="height:calc(100vh - 116px); position: relative; outline: none;"></vicav-map>
        </div>
    </client-only>
</template>
