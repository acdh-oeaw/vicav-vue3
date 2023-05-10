<script setup lang="ts">
import { z } from "zod";
import {ComputedRef} from "vue";
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

type GeoJsonObject = z.infer<typeof featureSchema>

$api.baseUrl = "https://vicav.acdh-ch-dev.oeaw.ac.at/vicav";
const { data, pending, error, refresh } = await useAsyncData(
    () => $api.biblMarkersTei.getMarkers({query: ".*", scope: "geo"}, { headers: { accept: "application/json" }}),
    {
      transform: (items) => items.data.filter((item) => {
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
const items: ComputedRef<GeoJsonObject[]> = computed(() => data?.value as GeoJsonObject[] || [])
</script>

<template>
    <client-only>
        <MenuBar/>
        <div style="position:relative; overflow: hidden;">
          <WindowManager/>
          <vicav-map :items="items" style="height:calc(100vh - 116px); position: relative; outline: none;"></vicav-map>
        </div>
    </client-only>
</template>
