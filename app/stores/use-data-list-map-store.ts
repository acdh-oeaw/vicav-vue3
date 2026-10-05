import { defineStore } from "pinia";
import { computed, effectScope, markRaw, onScopeDispose, ref, shallowReactive } from "vue";

import {
	getSimpleMetadataValue,
	simpleMetadataAccessors,
	useTeiHeadersStore,
} from "@/stores/use-tei-headers-store.ts";
import type { DataListMapLayer, DataListWindowItem } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";
import { createSimpleMetadataTable } from "@/utils/simple-metadata-table.ts";

const colors = ["#b91c1c", "#0369a1", "#15803d", "#7e22ce", "#b45309", "#0f766e"];

function isCoordinates(value: unknown): value is [number, number] {
	return (
		Array.isArray(value) &&
		value.length >= 2 &&
		typeof value[0] === "number" &&
		typeof value[1] === "number" &&
		Number.isFinite(value[0]) &&
		Number.isFinite(value[1]) &&
		Math.abs(value[0]) <= 180 &&
		Math.abs(value[1]) <= 90
	);
}

function normalizeReference(reference: string): string {
	return reference.replace(/^geo:/i, "").trim();
}

function popupLabelFor(item: simpleTEIMetadata): string | undefined {
	if (!["Feature", "SampleText"].includes(item.dataType) || item.person.length === 0)
		return undefined;

	return item.person
		.map((person) => `${person.name} (age: ${person.age}, sex: ${person.sex})`)
		.join(", ");
}

export const useDataListMapStore = defineStore("data-list-map", () => {
	const datasets = shallowReactive(new Map<string, ReturnType<typeof createDataset>>());
	const metadataStore = useTeiHeadersStore();
	const layers = computed<Record<string, DataListMapLayer>>(() =>
		Object.fromEntries(
			[...datasets]
				.filter(([, dataset]) => dataset.mapped.value)
				.map(([id, dataset]) => [
					id,
					{
						id,
						title: dataset.title.value,
						color: dataset.color,
						enabled: dataset.enabled.value,
						markers: resolveMarkers(
							dataset.model
								? dataset.model.table.getFilteredRowModel().flatRows.map((row) => row.original)
								: dataset.items.value,
						),
					},
				]),
		),
	);
	const colorsById = ref<Record<string, string>>({});
	const { data: projectData } = useProjectInfo();

	function colorFor(id: string): string {
		const current = colorsById.value[id];
		if (current) return current;
		const color = colors[Object.keys(colorsById.value).length % colors.length]!;
		colorsById.value = { ...colorsById.value, [id]: color };
		return color;
	}

	function fallbackLocation(item: simpleTEIMetadata) {
		const geoFeatures =
			projectData.value?.projectConfig?.staticData?.geo?.flatMap(
				(collection) => collection.features,
			) ?? [];
		for (const feature of geoFeatures) {
			const properties = feature.properties as {
				"@id"?: string;
				name?: string;
				referencedBy?: Array<{ source?: string; ids?: Array<{ id?: string; reference?: string }> }>;
			};
			for (const reference of properties.referencedBy ?? []) {
				if (reference.source !== item.geoSource) continue;
				if (
					reference.ids?.some(
						(entry) =>
							entry.id === item.id &&
							(!item.geoReference ||
								normalizeReference(entry.reference ?? "") ===
									normalizeReference(item.geoReference)),
					)
				)
					return {
						coordinates:
							feature.geometry && isCoordinates(feature.geometry.coordinates)
								? feature.geometry.coordinates
								: undefined,
						placeName: properties.name,
					};
			}
		}
		return undefined;
	}

	function resolveMarkers(items: Array<simpleTEIMetadata>) {
		const seen = new Set<string>();
		return items.flatMap((item) => {
			const placeName = [item.place.settlement, item.place.region, item.place.country]
				.map((name) => name?.trim())
				.find((name) => name != null && name.length > 0);
			const fallback = item.coordinates && placeName ? undefined : fallbackLocation(item);
			const coordinates = item.coordinates ?? fallback?.coordinates;
			if (!coordinates) return [];
			const key = `${item.geoSource}:${item.id}:${coordinates.join(",")}`;
			if (seen.has(key)) return [];
			seen.add(key);
			return [
				{
					id: item.id,
					label: item.label,
					placeName: placeName ?? fallback?.placeName ?? "Unknown place",
					alt: popupLabelFor(item),
					dataType: item.dataType,
					coordinates,
				},
			];
		});
	}

	function createDataset(id: string, title: string, params: DataListWindowItem["params"]) {
		const scope = effectScope(true);
		const dataset = scope.run(() => {
			const definition = ref({
				dataTypes: [...params.dataTypes],
				filterListBy: params.filterListBy,
			});
			const items = computed(() =>
				metadataStore.simpleItems.filter((item) => {
					if (!definition.value.dataTypes.includes(item.dataType)) return false;
					const filter = definition.value.filterListBy;
					if (!filter || !Object.hasOwn(simpleMetadataAccessors, filter.key)) return true;
					return (
						getSimpleMetadataValue(item, filter.key as keyof typeof simpleMetadataAccessors) ===
						filter.value
					);
				}),
			);
			const dataType = params.dataTypes.length === 1 ? params.dataTypes[0] : undefined;
			const model =
				dataType && ["CorpusText", "SampleText", "Feature", "Profile"].includes(dataType)
					? createSimpleMetadataTable({
							getItems: () => items.value,
							dataType,
							listState: params.listState,
							defaultFacets: dataType === "CorpusText" ? { "@hasTEIw": ["true"] } : {},
						})
					: undefined;
			return {
				title: ref(title),
				definition,
				items,
				model,
				enabled: ref(params.mapEnabled === true),
				mapped: ref(params.mapEnabled === true),
			};
		})!;
		return markRaw({
			...dataset,
			color: colorFor(id),
			dispose: () => {
				scope.stop();
			},
		});
	}

	function ensureDataset(id: string, title: string, params: DataListWindowItem["params"]) {
		const existing = datasets.get(id);
		if (existing) {
			existing.title.value = title;
			existing.definition.value = {
				dataTypes: [...params.dataTypes],
				filterListBy: params.filterListBy,
			};
			return existing;
		}
		const dataset = createDataset(id, title, params);
		datasets.set(id, dataset);
		return dataset;
	}

	function setEnabled(id: string, enabled: boolean) {
		const dataset = datasets.get(id);
		if (!dataset) return;
		if (enabled) dataset.mapped.value = true;
		dataset.enabled.value = enabled;
	}

	function toggleLayer(id: string) {
		const dataset = datasets.get(id);
		if (dataset) setEnabled(id, !dataset.enabled.value);
	}

	function removeDataset(id: string) {
		datasets.get(id)?.dispose();
		datasets.delete(id);
	}

	onScopeDispose(() => {
		datasets.forEach((dataset) => {
			dataset.dispose();
		});
		datasets.clear();
	});

	return {
		datasets,
		layers,
		colorFor,
		resolveMarkers,
		ensureDataset,
		setEnabled,
		toggleLayer,
		removeDataset,
	};
});
