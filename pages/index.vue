<script setup lang="ts">
	import { useAppDataStore } from '~~/store/appData'
    const AppDataStore = useAppDataStore()
    const title = computed(() => AppDataStore.appTitle)
    watch(title, (title) => { document.title = title })
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
        <WindowManager/>
    </client-only>
</template>
