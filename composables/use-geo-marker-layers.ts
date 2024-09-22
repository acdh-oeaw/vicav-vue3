import { useQueries } from "@tanstack/vue-query";
import type { Feature, Point } from "geojson";

import type { GeoTargetTypeParameters, MarkerProperties, MarkersType } from "@/lib/api-client";

export function useGeoMarkerLayers(
	queries: MaybeRef<Array<Required<GeoTargetTypeParameters>>>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQueries({
		queries: computed(() => {
			return toRef(queries).value.map((params) => {
				return {
					enabled: options?.enabled,
					queryKey: ["get-markers", params] as const,
					async queryFn() {
						const { endpoint, queryString, queryParams, scope } = params;

						let response;

						switch (endpoint) {
							case "bibl_markers_tei":
								response = await api.vicav.getMarkers(
									{ query: queryString, scope: scope },
									{ headers: { accept: "application/json" } },
								);
								break;
							case "compare_markers":
								response = await api.vicav.getCompareMarkers(
									{
										type: queryParams.type!,
										ids: queryParams.ids!,
										...queryParams,
									},
									{
										headers: { accept: "application/json" },
									},
								);
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
				};
			});
		}),
	});
}
