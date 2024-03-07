<script lang="ts" setup>
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { GeojsonFilterSchema } from "@/types/global.d";

interface Props {
	params: Zod.infer<typeof GeojsonFilterSchema>["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const GeojsonStore = useGeojsonStore();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { tables } = storeToRefs(GeojsonStore);

const facets = computed(() => {
	return GeojsonStore.getFacetList(params.value.url);
});
</script>

<template>
	<div v-for="(facet, index) in facets" :key="index">{{ facet }}</div>
</template>
