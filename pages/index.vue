<script setup lang="ts">
import { GeoJsonObject } from 'geojson'
const { $api } = useNuxtApp();

$api.baseUrl = "https://vicav.acdh-ch-dev.oeaw.ac.at/vicav";
$api.project.getProject({ headers: { accept: "application/json" }});
const { data, pending, error, refresh } = await useAsyncData(
    () => $api.biblMarkersTei.getMarkers({query: ".*", scope: "geo"}, { headers: { accept: "application/json" }}),
    {
      transform: (items) => items.data.filter((item) => { return item.properties.name != "al-Jadi" })
    },
)
onMounted(() => {
  refresh()
})
console.log(data.value);
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
