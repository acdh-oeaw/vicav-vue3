import { useQuery } from "@tanstack/vue-query";
import type { Table } from "@tanstack/vue-table";

import {
	type FeatureCollectionType,
	FeatureDefinitionSchema,
	type FeatureDefinitionType,
	type FeatureType,
	GeoFeatureSchema,
} from "@/types/global.d";

export const useGeojsonStore = defineStore("geojson", () => {
	const fetchedData = ref<Map<string, FeatureCollectionType>>(new Map());
	const fetchedFeatureDefinitions = ref<Map<string, Array<FeatureDefinitionType>>>(new Map());
	const tables = ref<Map<string, Table<FeatureType>>>(new Map());

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
					const result = GeoFeatureSchema.passthrough().safeParse(feature);
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

	const fetchFeatureDefinitions = (url: string) => {
		return useQuery({
			enabled: true,
			queryKey: [url],
			async queryFn() {
				const response = await fetch(url);
				return response.json() as Promise<Array<FeatureDefinitionType>>;
			},
			select: (data) => {
				const featureDefinitions = data.map((featureDefinition) => {
					const result = FeatureDefinitionSchema.safeParse(featureDefinition);
					if (result.success) {
						console.log(result.data);
						return result.data;
					} else {
						console.error(result.error);
						return null;
					}
				});
				fetchedFeatureDefinitions.value.set(
					url,
					featureDefinitions as Array<FeatureDefinitionType>,
				);
			},
		});
	};

	return {
		fetchedData,
		fetchedFeatureDefinitions,
		fetchGeojson,
		fetchFeatureDefinitions,
		tables,
	};
});
