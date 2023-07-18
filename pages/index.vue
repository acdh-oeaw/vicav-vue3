<script setup lang="ts">
	import { useAppDataStore } from '~~/store/appData'
  import { z } from "zod";
  import {ComputedRef} from "vue";

  const AppDataStore = useAppDataStore()
  const title = computed(() => AppDataStore.appTitle)
  watch(title, (title) => { document.title = title })

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

  $api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
  const { data, pending, error, refresh } = await useAsyncData(
    () => $api.biblMarkersTei.getMarkers({query: ".*", scope: "geo"}, { headers: { accept: "application/json" }}),
    {
      transform: (items) => items.data.filter((item) => {
        try {
          featureSchema.parse(item);
          return true
        } catch (error) {
          console.error(error,item);
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
  <MenuBar/>
  <client-only>
    <WindowManager/>
    <vicav-map :items="items" style="height:calc(100vh - 68px); position: relative; top: -36px; outline: none;"></vicav-map>
  </client-only>
</template>
