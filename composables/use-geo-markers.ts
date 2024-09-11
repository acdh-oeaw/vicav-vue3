import { useQuery } from "@tanstack/vue-query";
import type { Feature, Point } from "geojson";

import type { MarkerProperties, MarkersType } from "@/lib/api-client";
import type { GeoMapSchema } from "@/types/global.d";

export function useGeoMarkers(
	params: MaybeRef<Zod.infer<typeof GeoMapSchema>["params"]>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-markers", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const { endpoint, queryString, queryParams, scope } = params;
			let response;

			switch (endpoint) {
				case "bibl_markers_tei":
					response = await api.vicav.getMarkers(
						{ query: queryString, scope: scope ?? [] },
						{ headers: { accept: "application/json" } },
					);
					break;
				case "compare_markers":
					response = await api.vicav.getCompareMarkers(queryParams, {
						headers: { accept: "application/json" },
					});
					break;
				default:
					response = await api.vicav.getGeoMarkers(
						endpoint.slice(0, "_markers".length * -1) as MarkersType,
						{ headers: { accept: "application/json" } },
					);
					break;
			}
			return response.data as Array<Feature<Point, MarkerProperties>>;
		},
	});
}
