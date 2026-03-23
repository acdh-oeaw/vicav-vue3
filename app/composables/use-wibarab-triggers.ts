// Adapted from https://reka-ui.com/examples/combobox-textarea

import type { Table } from "@tanstack/vue-table";
import { storeToRefs } from "pinia";

import type { TriggerMap } from "@/components/searchbar";
import { type TaxonomyTreeEntry, useGeojsonStore } from "@/stores/use-geojson-store.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const {
	getTaxonomyTree,
	getSortedTaxonomyChildren,
	getSortedTaxonomyFeatureValues,
	getFacetsForId,
} = useGeojsonStore();

function getFeatureList() {
	const table = tables.value.get(url);
	if (!table) return [];
	const features = table
		.getAllLeafColumns()
		.filter((column) => column.getCanFilter())
		.map((column) => ({
			value: `${column.id}:`,
			displayValue: column.columnDef.header! as string,
			col: column,
		}));
	return features;
}
const features = computed(() => getFeatureList());

function getValueList(columns: typeof features.value) {
	const table = tables.value.get(url);
	if (!table) return [];

	function traverseTaxonomyTree(
		entry: TaxonomyTreeEntry,
		facets: Array<[string, number]>,
		currentLevel = 0,
	): Array<{ key: string; label: string; level: number }> {
		const sortedChildren = getSortedTaxonomyChildren(entry, facets) ?? [];
		const sortedFeatureValues = getSortedTaxonomyFeatureValues(entry, facets) ?? [];
		return [
			...sortedFeatureValues.map((v) => ({ key: v[0], label: v[0], level: currentLevel })),
			...sortedChildren
				.map((c) => [
					{ key: c[0], label: c[1].label ?? "", level: currentLevel },
					...traverseTaxonomyTree(c[1], facets, currentLevel + 1),
				])
				.flat(),
		];
	}

	return columns
		.map((item) => {
			const taxonomy =
				getTaxonomyTree(item.col.id).get(item.col.id) ?? getTaxonomyTree(item.col.id).get("");
			const facets = getFacetsForId(table as Table<unknown>, item.col.id);
			if (taxonomy) {
				return traverseTaxonomyTree(taxonomy, facets).map(({ key, label, level }) => ({
					value: `"${key}"`,
					displayValue: `${Array.from(Array(level))
						.map(() => "\t")
						.join("")}${label}`,
				}));
			}
			return facets.map((f) => ({
				value: `"${f[0]}"`,
				displayValue: f[0],
			}));
		})
		.flat();
}

function getMetaInfoList() {
	const excludedMetaInfoKeys = new Set(["source_representations", "examples", "resp"]);

	const table = tables.value.get(url);
	const metaInfo = new Map<string, Set<string>>();
	if (!table) return new Map() as TriggerMap;
	table.getCoreRowModel().rows.forEach((row) => {
		Object.entries(
			row.original.properties as Record<string, Record<string, Array<Record<string, unknown>>>>,
		).forEach(([key, featureValues]) => {
			if (typeof featureValues === "string" || key === "alternateNames") return;
			Object.values(featureValues).forEach((featureValueInfos) => {
				featureValueInfos.forEach((featureValueInfo) => {
					Object.entries(featureValueInfo).forEach(([key, val]) => {
						if (excludedMetaInfoKeys.has(key)) return;
						if (!metaInfo.has(key)) metaInfo.set(key, new Set());
						if (Array.isArray(val)) val.forEach((v: string) => metaInfo.get(key)?.add(v));
						else if (typeof val === "string") metaInfo.get(key)?.add(val);
						else {
							if ("short_cit" in (val as Record<string, string>))
								metaInfo.get(key)?.add((val as Record<string, string>).short_cit!);
						}
					});
				});
			});
		});
	});
	return new Map(
		[...metaInfo.entries()].map(([key, val]) => [
			key,
			[{ value: "ANY", displayValue: "*Any*" }].concat(
				[...val].map((v) => ({
					value: `"${v}"`,
					displayValue: v,
				})),
			),
		]),
	);
}
const metaInfo = computed(() => getMetaInfoList());
const metaInfoKeys = computed(() =>
	[...metaInfo.value.keys()].map((key) => ({ value: `${key}:`, displayValue: key })),
);

const operators = ["and", "or"].map((o) => ({ displayValue: o, value: o.toUpperCase() }));

const wibarabTriggers = computed(() => {
	const map = {
		'" ': operators,
		") ": operators,
		"ANY ": operators,
		...Object.fromEntries(
			features.value.map((f) => [
				f.value,
				[{ value: "ANY", displayValue: "*Any*" }].concat(getValueList([f])),
			]),
		),
		...Object.fromEntries([...metaInfo.value.entries()].map(([key, val]) => [`${key}:`, val])),
		"": [...features.value, ...metaInfoKeys.value],
	};

	return new Map(Object.entries(map));
});

export function useWibarabTriggers() {
	return { wibarabTriggers, metaInfo };
}
