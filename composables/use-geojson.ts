import { useQuery } from "@tanstack/vue-query";

import { GeoFeatureSchema } from "@/types/geojson";
import type { FeatureCollectionType } from "@/types/global.d.ts";

export function useGeojson(options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-geojson-data"] as const,
		async queryFn() {
			return await api.vicav.getProject({ headers: { accept: "application/json" } });
		},
		select: (response) => {
			const GeoData: Array<FeatureCollectionType> = [];
			const rawGeoData = response.data.projectConfig?.staticData?.geo;
			rawGeoData?.forEach((data, index) => {
				const features = data.features.filter((feature) => {
					const result = GeoFeatureSchema.safeParse(feature);
					if (result.success) {
						return true;
					} else {
						console.error(result.error);
						return false;
					}
				});
				GeoData.push({
					//@ts-expect-error - type definition from API-spec slightly off
					features,
					...rawGeoData[index],
				});
			});
			return GeoData;
		},
	});
}
