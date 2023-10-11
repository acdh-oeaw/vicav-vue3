import { useQuery } from "@tanstack/vue-query";
import type { Feature, Point } from "geojson";

import type { MarkerProperties, MarkersType, QueryDescription } from "@/lib/api-client/Api";

export function useGeoMarkers(
	params: MaybeRef<Required<QueryDescription>>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-markers", params] as const,
		async queryFn({ queryKey: [, params] }) {
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
	});
}
