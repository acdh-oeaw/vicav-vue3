<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";
import type { Feature, Point } from "geojson";
import type Zod from "zod";

import type { MarkerProperties } from "@/components/geo-map.context.ts";
import type { GeoMapToolbarOption } from "@/components/geo-map-toolbar.vue";
import type { GeoTargetTypeParameters } from "@/lib/api-client";
import { type GeoMapSchema, GeoMapSubnavItemSchema } from "@/types/global";

type ItemId = string;
type DataListMarkerFeature = Feature<
	Point,
	Omit<MarkerProperties, "params"> & {
		dataListMapColors?: Array<string>;
		dataListMapMarkers?: Array<DataListMarkerFeature>;
		params: { textId: string };
	}
>;

interface Props {
	title?: string;
	params: Zod.infer<typeof GeoMapSchema>["params"];
}

const props = defineProps<Props>();
const { title, params } = toRefs(props);
const { data: projectData } = useProjectInfo();
const windowsStore = useWindowsStore();

const createId = function (params: Zod.infer<typeof GeoMapSchema>["params"]): ItemId {
	const endpoint = params.endpoint,
		queryString = params.queryString,
		scope = params.scope?.join(",") ?? "",
		queryParams = Object.values(params.queryParams ?? {}).join(",");
	return `${endpoint}:${queryString}:${scope}:${queryParams}`;
};

function getDataListToolbarTitle(title: string): string {
	//TODO: this comes from the list window title set through the projectConfig
	//we should consider changing it, as it may contain a filtered state, not all items
	return title.replace(/^List all\s*/i, "");
}

const itemsById = computed(() => {
	if (params.value.dataListLayers) {
		return new Map<ItemId, GeoMapToolbarOption>(
			params.value.dataListLayers.map((layer) => [
				`data-list:${layer.id}`,
				{ title: getDataListToolbarTitle(layer.title), color: layer.color },
			]),
		);
	}
	const items = projectData.value?.projectConfig?.menu?.subnav?.reduce(
		(filtered: Array<Zod.infer<typeof GeoMapSubnavItemSchema>>, item) => {
			const safeParse = GeoMapSubnavItemSchema.safeParse(item);
			if (safeParse.success) {
				safeParse.data.id = createId(safeParse.data.params);
				filtered.push(safeParse.data);
			}
			return filtered;
		},
		[] as Array<Zod.infer<typeof GeoMapSubnavItemSchema>>,
	);
	if (items == null) return new Map<ItemId, Zod.infer<typeof GeoMapSubnavItemSchema>>();
	return keyByToMap(items, (item) => item.id);
});

const id = createId(params.value);
if (!params.value.dataListLayers && !itemsById.value.has(id)) {
	itemsById.value.set(id, {
		title: params.value.title ?? title.value,
		params: params.value,
	} as Zod.infer<typeof GeoMapSubnavItemSchema>);
}

const selected = ref<Set<ItemId>>(
	new Set(
		params.value.dataListLayers
			? params.value.dataListLayers.map((layer) => `data-list:${layer.id}`)
			: [id],
	),
);

function onSelect(id: ItemId) {
	if (id.startsWith("data-list:")) {
		const mapSyncId = id.slice("data-list:".length);
		const listWindow = [...windowsStore.registry.values()].find(
			(window) => window.targetType === "DataList" && window.params.mapSyncId === mapSyncId,
		);
		if (listWindow?.targetType === "DataList") {
			windowsStore.updateWindowParams(listWindow.id, {
				...listWindow.params,
				mapEnabled: !listWindow.params.mapEnabled,
			});
			return;
		}
	}
	if (selected.value.has(id)) {
		selected.value.delete(id);
	} else {
		selected.value.add(id);
	}
}

watch(
	() => params.value.dataListLayers?.map((layer) => `data-list:${layer.id}`),
	(ids) => {
		if (ids) selected.value = new Set(ids);
	},
	{ deep: true },
);

const onMarkerClick = useMarkerClickHandler();

const queries = useGeoMarkerLayers(
	computed(() => {
		if (params.value.dataListLayers) return [];
		return Array.from(selected.value).map((id) => {
			return (itemsById.value.get(id) as Zod.infer<typeof GeoMapSubnavItemSchema> | undefined)
				?.params as Required<GeoTargetTypeParameters>;
		});
	}),
);

const isLoading = computed(() => {
	return queries.value.some((query) => query.isPending || query.isPlaceholderData);
});

function createDataListMarkerFeature(
	layer: NonNullable<Zod.infer<typeof GeoMapSchema>["params"]["dataListLayers"]>[number],
	marker: (typeof layer.markers)[number],
): DataListMarkerFeature {
	return {
		type: "Feature",
		geometry: { type: "Point", coordinates: marker.coordinates },
		properties: {
			alt: marker.label,
			dataListMapColors: [layer.color],
			hitCount: 1,
			label: marker.label,
			name: marker.label,
			params: { textId: marker.id },
			targetType: marker.dataType,
			textId: marker.id,
			type: "geo",
		},
	};
}

// TODO: pass as separate feature groups to geo map (?)
const markers = computed<Array<Feature<Point, MarkerProperties>>>(() => {
	if (params.value.dataListLayers) {
		const locations = new Map<string, Array<DataListMarkerFeature>>();
		for (const layer of params.value.dataListLayers) {
			if (!selected.value.has(`data-list:${layer.id}`)) continue;
			for (const marker of layer.markers) {
				const key = marker.coordinates.join(",");
				const location = locations.get(key) ?? [];
				location.push(createDataListMarkerFeature(layer, marker));
				locations.set(key, location);
			}
		}
		const dataListMarkers = [...locations.values()].map((location): DataListMarkerFeature => {
			if (location.length === 1) return location[0]!;
			const first = location[0]!;
			const label = `${String(location.length)} items`;
			return {
				type: "Feature",
				geometry: first.geometry,
				properties: {
					alt: label,
					dataListMapColors: location.flatMap(
						(marker) => marker.properties.dataListMapColors ?? [],
					),
					dataListMapMarkers: location,
					hitCount: location.length,
					label,
					name: label,
					params: first.properties.params,
					targetType: first.properties.targetType,
					textId: first.properties.textId,
					type: "geo",
				},
			};
		});
		return dataListMarkers as unknown as Array<Feature<Point, MarkerProperties>>;
	}
	return queries.value.flatMap((query) => query.data ?? []);
});

const hasSpatialData = computed(() =>
	markers.value.some((marker) => {
		const coordinates = marker.geometry?.coordinates;
		return (
			Array.isArray(coordinates) &&
			coordinates.length >= 2 &&
			typeof coordinates[0] === "number" &&
			typeof coordinates[1] === "number" &&
			Number.isFinite(coordinates[0]) &&
			Number.isFinite(coordinates[1])
		);
	}),
);

const isDataListMap = computed(() => params.value.endpoint === "data_markers");
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
			<GeoMap
				v-if="hasSpatialData"
				:height="height"
				:markers="markers"
				:width="width"
				@marker-click="onMarkerClick"
			/>

			<Centered v-if="isLoading">
				<LoadingIndicator />
			</Centered>
			<Centered v-else-if="!hasSpatialData && !isDataListMap"> No spatial data to render </Centered>
		</VisualisationContainer>

		<p
			v-if="isDataListMap && !isLoading && !hasSpatialData"
			class="pointer-events-none absolute inset-0 z-10 grid place-items-center"
		>
			No spatial data to render
		</p>
	</div>
</template>
