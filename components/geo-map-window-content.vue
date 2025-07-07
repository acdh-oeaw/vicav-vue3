<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";
import type { z } from "zod";

import type { GeoTargetTypeParameters } from "@/lib/api-client";
import { type GeoMapSchema, GeoMapSubnavItemSchema } from "@/types/global.d";

type ItemId = string;

interface Props {
	title?: string;
	params: z.infer<typeof GeoMapSchema>["params"];
}

const props = defineProps<Props>();
const { title, params } = toRefs(props);
const { data: projectData } = useProjectInfo();

const createId = function (params: z.infer<typeof GeoMapSchema>["params"]): ItemId {
	const endpoint = params.endpoint,
		queryString = params.queryString,
		scope = params.scope?.join(",") ?? "",
		queryParams = Object.values(params.queryParams ?? {}).join(",");
	return `${endpoint}:${queryString}:${scope}:${queryParams}`;
};

const itemsById = computed(() => {
	const items = projectData.value?.projectConfig?.menu?.subnav?.reduce(
		(filtered: Array<z.infer<typeof GeoMapSubnavItemSchema>>, item) => {
			const safeParse = GeoMapSubnavItemSchema.safeParse(item);
			if (safeParse.success) {
				safeParse.data.id = createId(safeParse.data.params);
				filtered.push(safeParse.data);
			}
			return filtered;
		},
		[] as Array<z.infer<typeof GeoMapSubnavItemSchema>>,
	);
	if (items == null) return new Map<ItemId, z.infer<typeof GeoMapSubnavItemSchema>>();
	return keyByToMap(items, (item) => item.id);
});

const id = createId(params.value);
if (!itemsById.value.has(id)) {
	itemsById.value.set(id, {
		title: params.value.title ?? title.value,
		params: params.value,
	} as z.infer<typeof GeoMapSubnavItemSchema>);
}

const selected = ref<Set<ItemId>>(new Set([id]));

function onSelect(id: ItemId) {
	if (selected.value.has(id)) {
		selected.value.delete(id);
	} else {
		selected.value.add(id);
	}
}

const onMarkerClick = useMarkerClickHandler();

const queries = useGeoMarkerLayers(
	computed(() => {
		return Array.from(selected.value).map((id) => {
			return itemsById.value.get(id)?.params as Required<GeoTargetTypeParameters>;
		});
	}),
);

const isLoading = computed(() => {
	return queries.value.some((query) => query.isPending || query.isPlaceholderData);
});

// TODO: pass as separate feature groups to geo map (?)
const markers = computed(() => {
	return queries.value.flatMap((query) => query.data ?? []);
});
</script>

<template>
	<div class="relative isolate grid size-full grid-rows-[auto_1fr]">
		<GeoMapToolbar
			v-if="itemsById.size > 0"
			:options="itemsById"
			:selected="selected"
			@select="onSelect"
		/>

		<VisualisationContainer
			v-slot="{ width, height }"
			:class="{ 'opacity-50 grayscale': isLoading }"
		>
			<GeoMap :height="height" :markers="markers" :width="width" @marker-click="onMarkerClick" />

			<Centered v-if="isLoading">
				<LoadingIndicator />
			</Centered>
		</VisualisationContainer>
	</div>
</template>
