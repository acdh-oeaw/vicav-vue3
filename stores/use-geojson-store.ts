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
		buildFeatureTaxonomy,
		featureValueTaxonomy,
		getTaxonomyTree,
		showAllDetails,
	};
});
