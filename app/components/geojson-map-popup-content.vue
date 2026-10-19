<script lang="ts" setup>
import type { Column } from "@tanstack/vue-table";
import type { Feature, Point } from "geojson";

import type { MarkerProperties } from "@/components/geo-map.context.ts";
import type { WindowItem } from "@/types/global.ts";

const props = defineProps<{
	markers: Array<Feature<Point, MarkerProperties>>;
}>();

const emit = defineEmits<{
	(event: "anchor-click", feature: Feature<Point, MarkerProperties>): void;
}>();

const $el = ref<HTMLElement>();
defineExpose({ $el });

const geojsonStore = useGeojsonStore();
const { featureValueTaxonomy } = storeToRefs(geojsonStore);
const { AND_OPERATOR } = useAdvancedQueries();
const openOrUpdateWindow = useOpenOrUpdateWindow();

interface ActiveValue {
	key: string;
	val: Array<Record<string, unknown>>;
}
interface ActiveFeature {
	column: Column<PatchedFeatureType>;
	label: string;
	values: Array<ActiveValue>;
}
interface LocationEntry {
	marker: Feature<Point, MarkerProperties>;
	name: string;
	features: Array<ActiveFeature>;
}

const locations = computed<Array<LocationEntry>>(() => {
	const columns = (geojsonStore.table?.getAllLeafColumns() ?? []) as Array<
		Column<PatchedFeatureType>
	>;
	const activeColumns = columns
		.map((column) => {
			const filterValue = ensureFilterValueMap(column.getFilterValue());
			return {
				column,
				active: new Set([...filterValue.keys()].flatMap((key) => key.split(AND_OPERATOR))),
				exclude: filterValue.exclude,
			};
		})
		.filter(({ active, exclude }) => active.size > 0 || exclude.size > 0);

	return props.markers.map((marker) => {
		const properties = marker.properties as unknown as Record<string, unknown>;
		const features = activeColumns.flatMap(({ column, active, exclude }) => {
			const raw = properties[column.id] as string | Record<string, ActiveValue["val"]> | undefined;
			const cellValue = typeof raw === "string" ? { [raw]: [{}] } : raw;
			const values = Object.entries(cellValue ?? {})
				.filter(([key]) => !exclude.has(key) && (active.size === 0 || active.has(key)))
				.map(([key, val]) => ({ key, val }));
			return values.length > 0
				? [{ column, label: String(column.columnDef.header ?? column.id), values }]
				: [];
		});
		return { marker, name: String(properties.name ?? marker.properties.label), features };
	});
});

function openFeatureValue(location: LocationEntry, feature: ActiveFeature, value: ActiveValue) {
	openOrUpdateWindow(
		{
			targetType: "FeatureValue",
			params: {
				values: value.val.map((v) => ({
					...v,
					title: value.key,
					place: location.name,
					feature: feature.label,
					featureId: feature.column.id,
					taxonomy: featureValueTaxonomy.value.get(`${feature.column.id}.${value.key}`)?.label,
				})),
				showCitation: false,
			},
		} as unknown as WindowItem,
		`Feature Value Observation: ${value.key} | ${location.name}`,
	);
}
</script>

<template>
	<div ref="$el" class="divide-y space-y-2">
		<div v-for="location in locations" :key="location.marker.id" class="pb-2">
			<h2 class="text-base font-bold">{{ location.name }}</h2>
			<p class="text-xs my-1!">
				Open
				<a href="#" @click.prevent.stop="emit('anchor-click', location.marker)"
					>all details of {{ location.name }}</a
				>
				or show one of the active feature values:
			</p>
			<ul v-if="location.features.length > 0" class="list-none text-xs ml-4">
				<li v-for="feature in location.features" :key="feature.column.id" class="my-1 list-disc">
					<span class="italic">{{ feature.label }}:</span>
					<template v-for="(value, idx) in feature.values" :key="value.key">
						{{ idx > 0 ? ", " : " " }}
						<a href="#" @click.prevent.stop="openFeatureValue(location, feature, value)">{{
							value.key
						}}</a>
					</template>
				</li>
			</ul>
			<p v-else class="text-xs italic">No active features.</p>
		</div>
	</div>
</template>
