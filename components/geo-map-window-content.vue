<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";

import type { ItemType, QueryDescription } from "@/lib/api-client/Api";

type ItemId = NonNullable<ItemType["target"]>;

interface Props {
	params: GeoMapWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data: projectData } = useProjectInfo();

const itemsById = computed(() => {
	const items = projectData.value?.projectConfig?.menu?.subnav;

	if (items == null) return new Map<ItemId, ItemType>();

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return keyByToMap(items, (item) => item.target!);
});

const selected = ref<Set<ItemId>>(new Set([params.value.id]));

function onSelect(id: ItemId) {
	if (selected.value.has(id)) {
		selected.value.delete(id);
	} else {
		selected.value.add(id);
	}
}

const queries = useGeoMarkerLayers(
	computed(() => {
		return Array.from(selected.value).map((id) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return itemsById.value.get(id)!.query! as Required<QueryDescription>;
		});
	}),
);

const isFetching = computed(() => {
	return queries.value.some((query) => query.isFetching);
});

// TODO: pass as separate feature groups to geo map (?)
const markers = computed(() => {
	return queries.value.flatMap((query) => query.data ?? []);
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
