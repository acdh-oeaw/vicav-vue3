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
					columnDefinitions.filter((f) => f) as Array<ColumnDefinitionType>,
				);
			},
		});
	};

	const getFacetList = (key: string): Array<Record<string, string>> | undefined => {
		return columnDefs.value.get(key)?.reduce((facetList: Array<Record<string, string>>, col) => {
			// @ts-expect-error - col.values is always available as it is parsed and filtered by zod
			return facetList.concat(Object.values(col)[0].values);
		}, []);
	};

	return {
		fetchedData,
		columnDefs,
		fetchColumnDefinitions,
		fetchGeojson,
		getFacetList,
		tables,
	};
});
