import { useQuery } from "@tanstack/vue-query";
import type { Table } from "@tanstack/vue-table";
import { defineStore } from "pinia";

import { type FeatureCollectionType, type FeatureType, GeoFeatureSchema } from "@/types/global.d";

export interface TaxonomyTreeEntry {
	label: string | undefined;
	featureValues: Array<string>;
	children: TaxonomyTree;
}
export type TaxonomyTree = Map<string, TaxonomyTreeEntry>;
export const useGeojsonStore = defineStore("geojson", () => {
	const fetchedData = ref<Map<string, FeatureCollectionType>>(new Map());
	const tables = shallowRef<Map<string, Table<FeatureType>>>(new Map());

	const showAllDetails = ref<boolean>(false);
	const featureValueTaxonomy = shallowRef<
		Map<string, { label: string | undefined; taxonomy: string } | undefined>
	>(new Map());
	function buildFeatureTaxonomy(
		features: Record<string, { values: Record<string, string>; taxonomy: Record<string, string> }>,
	) {
		for (const feature in features) {
			for (const value in features[feature]?.values) {
				featureValueTaxonomy.value.set(`${feature}.${value}`, {
					label: features[feature].taxonomy[features[feature].values[value]!],
					taxonomy: features[feature].values[value]!,
				});
			}
		}
	}
	function getTaxonomyTree(prefix = "") {
		const filteredResults = [...featureValueTaxonomy.value.entries()].filter(
			([_key, value]) =>
				(value?.taxonomy.startsWith(prefix) ?? false) ||
				(value?.taxonomy === "" && _key.startsWith(`${prefix}.`)),
		);
		const tree: TaxonomyTree = new Map();
		for (const res of filteredResults) {
			const keys = res[1]?.taxonomy.split(".");
			let subtree = tree;
			keys?.forEach((key, level) => {
				if (!subtree.has(key)) {
					subtree.set(key, {
						label: level === keys.length - 1 ? res[1]?.label : "",
						featureValues: [],
						children: new Map(),
					});
				}
				if (level === keys.length - 1) {
					subtree.get(key)!.featureValues.push(res[0].split(".")[1]!);
				} else {
					subtree = subtree.get(key)!.children;
				}
			});
		}
		return tree;
	}
	function getFacetsForId(table: Table<unknown>, colId: string) {
		const mappedRowData: Array<string> = table
			.getCoreRowModel()
			.flatRows.flatMap((row) => row.getValue(colId));
		const facetedData = mappedRowData.reduce((prev: Record<string, number>, current: string) => {
			if (!(current in prev)) prev[current] = 0;
			prev[current]!++;
			return prev;
		}, {});
		return Object.entries(facetedData).sort((a, b) => b[1] - a[1]);
	}
	function countChildren(
		parent: TaxonomyTreeEntry,
		facets: Array<[string, number]> | undefined,
	): number {
		const featureValueCounts = parent.featureValues.map(
			(val) => facets?.find((entry) => entry[0] === val)?.[1] ?? 0,
		);
		const childCounts = [...parent.children.values()].map((child) => countChildren(child, facets));
		return featureValueCounts.concat(childCounts).reduce((prev, curr) => prev + curr);
	}
	function getSortedTaxonomyChildren(
		entry: TaxonomyTreeEntry | undefined,
		facets: Array<[string, number]> | undefined,
	) {
		if (!entry?.children || entry.children.size === 0) return null;
		const childrenAndCount: Array<[string, TaxonomyTreeEntry, number]> = [
			...entry.children.entries(),
		].map((entry) => [...entry, countChildren(entry[1], facets)]);
		return childrenAndCount.sort((a, b) => b[2] - a[2]);
	}
	function getSortedTaxonomyFeatureValues(
		entry: TaxonomyTreeEntry | undefined,
		facets: Array<[string, number]> | undefined,
	) {
		if (!entry?.featureValues || entry.featureValues.length === 0) return null;
		const featureValuesAndCount: Array<[string, number]> = entry.featureValues.map((entry) => [
			entry,
			facets?.find((f) => f[0] === entry)?.[1] ?? 0,
		]);
		return featureValuesAndCount.sort((a, b) => b[1] - a[1]);
	}

	const fetchGeojson = (url: string) => {
		return useQuery({
			enabled: true,
			queryKey: [url],
			async queryFn() {
				const response = await fetch(url);
				return response.json() as Promise<FeatureCollectionType>;
			},

			select: (data) => {
				const features = data.features.map((feature) => {
					const result = GeoFeatureSchema.loose().safeParse(feature);
					if (result.success) {
						return result.data;
					} else {
						console.error(result.error);
						return null;
					}
				});
				fetchedData.value.set(url, {
					...data,
					features,
				} as FeatureCollectionType);
			},
		});
	};

	return {
		fetchedData,
		fetchGeojson,
		tables,
		getFacetsForId,
		buildFeatureTaxonomy,
		featureValueTaxonomy,
		getTaxonomyTree,
		showAllDetails,
		getSortedTaxonomyChildren,
		getSortedTaxonomyFeatureValues,
	};
});
