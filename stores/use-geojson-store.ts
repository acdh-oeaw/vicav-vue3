import { useQuery } from "@tanstack/vue-query";
import type { Table } from "@tanstack/vue-table";
import { defineStore } from "pinia";

import { type FeatureCollectionType, type FeatureType, GeoFeatureSchema } from "@/types/global.d";

export const useGeojsonStore = defineStore("geojson", () => {
	const fetchedData = ref<Map<string, FeatureCollectionType>>(new Map());
	const tables = shallowRef<Map<string, Table<FeatureType>>>(new Map());

	const showAllDetails = ref<boolean>(false);
	const featureValueTaxonomy = shallowRef<Map<string, string | undefined>>(new Map());
	function buildFeatureTaxonomy(
		features: Record<string, { values: Record<string, string>; taxonomy: Record<string, string> }>,
	) {
		for (const feature in features) {
			for (const value in features[feature]?.values) {
				featureValueTaxonomy.value.set(
					`${feature}.${value}`,
					features[feature].taxonomy[features[feature].values[value]!],
				);
			}
		}
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
		showAllDetails,
	};
});
