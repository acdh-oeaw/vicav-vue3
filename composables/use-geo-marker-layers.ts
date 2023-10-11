import { useQueries } from "@tanstack/vue-query";
import type { Feature, Point } from "geojson";

import type { MarkerProperties, MarkersType, QueryDescription } from "@/lib/api-client/Api";

export function useGeoMarkerLayers(
	queries: MaybeRef<Array<Required<QueryDescription>>>,
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
						const { endpoint, query, scope } = params;

						const response =
							endpoint === "bibl_markers_tei"
								? await api.vicav.getMarkers(
										{ query, scope },
										{ headers: { accept: "application/json" } },
								  )
								: await api.vicav.getGeoMarkers(
										endpoint.slice(0, "_markers".length * -1) as MarkersType,
										{ headers: { accept: "application/json" } },
								  );

						return response.data as Array<Feature<Point, MarkerProperties>>;
					},
				};
			});
		}),
	});
}
