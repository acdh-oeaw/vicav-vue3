import { useQuery } from "@tanstack/vue-query";
import type { Table } from "@tanstack/vue-table";

import {
	ColumnDefinitionSchema,
	type ColumnDefinitionType,
	type FeatureCollectionType,
	type FeatureType,
	GeoFeatureSchema,
} from "@/types/global.d";

export const useGeojsonStore = defineStore("geojson", () => {
	const fetchedData = ref<Map<string, FeatureCollectionType>>(new Map());
	const columnDefs = ref<Map<string, Array<ColumnDefinitionType>>>(new Map());
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
						return false;
					}
				});
				fetchedData.value.set(url, {
					...data,
					features: features.filter((f) => f),
				} as FeatureCollectionType);
			},
		});
	};

	const fetchColumnDefinitions = (key: string, url: string) => {
		return useQuery({
			enabled: true,
			queryKey: [url],
			async queryFn() {
				const response = await fetch(url);
				return response.json() as Promise<Array<ColumnDefinitionType>>;
			},
			select: (data: Array<ColumnDefinitionType>) => {
				const columnDefinitions = data.map((columnDefinition) => {
					const result = ColumnDefinitionSchema.safeParse(columnDefinition);
					if (result.success) {
						return result.data;
					} else {
						console.error(result.error);
						return false;
					}
				});
				columnDefs.value.set(
					key,
					columnDefinitions.filter((f) => f),
				);
			},
		});
	};

	return {
		fetchedData,
		columnDefs,
		fetchColumnDefinitions,
		fetchGeojson,
		tables,
	};
});
