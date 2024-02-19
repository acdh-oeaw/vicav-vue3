import { useQuery } from "@tanstack/vue-query";
import type { Table } from "@tanstack/vue-table";

import { type FeatureCollectionType, type FeatureType, GeoFeatureSchema } from "@/types/global.d";

export const useGeojsonStore = defineStore("geojson", () => {
	const fetchedData = ref<Map<string, FeatureCollectionType>>(new Map());
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

	return {
		fetchedData,
		fetchGeojson,
		tables,
	};
});
