import { defineStore } from "pinia";

import type { DataListMapLayer } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";

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
	const layers = ref<Record<string, DataListMapLayer>>({});
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

	function setLayer(id: string, title: string, items: Array<simpleTEIMetadata>): DataListMapLayer {
		const layer = { id, title, color: colorFor(id), markers: resolveMarkers(items) };
		layers.value = { ...layers.value, [id]: layer };
		return layer;
	}

	function removeLayer(id: string): void {
		if (!(id in layers.value)) return;
		layers.value = Object.fromEntries(Object.entries(layers.value).filter(([key]) => key !== id));
	}

	return { layers, colorFor, resolveMarkers, setLayer, removeLayer };
});
