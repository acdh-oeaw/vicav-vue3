<script setup lang="ts">
	import { useAppDataStore } from '~~/store/appData'
  import { useMapDataStore, IMapLayer } from '~~/store/mapData'
  import {ComputedRef} from "vue";


  const AppDataStore = useAppDataStore()
  const MapDataStore = useMapDataStore()

  const title = computed(() => AppDataStore.appTitle)
  watch(title, (title) => { document.title = title })

  onMounted(async () => {
    await MapDataStore.getMarkers('background', {
      "endpoint": "bibl_markers_tei",
      "query": ".*",
      "scope": "geo",
    });
    console.log(MapDataStore.layerById("background"));
  })
  const items: ComputedRef<IMapLayer> = computed(() => MapDataStore.layerById("background") as IMapLayer || { data: []})
</script>

<template>
  <MenuBar/>
    <client-only>
      <WindowManager/>
      <vicav-map :items="items.data" style="height:calc(100vh - 68px); position: relative; top: -36px; outline: none;"></vicav-map>
    </client-only>
</template>
