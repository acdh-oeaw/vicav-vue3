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
						const { endpoint, queryString, scope } = params;

						const response =
							endpoint === "bibl_markers_tei"
								? await api.vicav.getMarkers(
										// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
										{ query: queryString ?? ".*", scope },
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
