<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";

import type { ItemType } from "@/lib/api-client/Api";

interface Props {
	params: GeoMapWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data: projectData } = useProjectInfo();

const itemsById = computed(() => {
	const items = projectData.value?.projectConfig?.menu?.subnav;

	if (items == null) return new Map<ItemType["target"], ItemType>();

	return keyByToMap(items, (item) => item.target);
});

const selected = ref<Set<ItemType["target"]>>(new Set([params.value.id]));

function onSelect(id: ItemType["target"]) {
	if (selected.value.has(id)) {
		selected.value.delete(id);
	} else {
		selected.value.add(id);
	}
}

// TODO: useQueries to fetch and merge multiple geojson feature groups
const { data, isFetching } = useGeoMarkers(params);

const markers = computed(() => {
	return data.value ?? [];
});
</script>

<template>
	<div class="relative isolate grid h-full w-full grid-rows-[auto_1fr]">
		<GeoMapToolbar
			v-if="itemsById.size > 0"
			:options="itemsById"
			:selected="selected"
			@select="onSelect"
		/>

		<VisualisationContainer
			v-slot="{ width, height }"
			:class="{ 'opacity-50 grayscale': isFetching }"
		>
			<GeoMap :height="height" :markers="markers" :width="width" />

			<Centered v-if="isFetching">
				<LoadingIndicator />
			</Centered>
		</VisualisationContainer>
	</div>
</template>
