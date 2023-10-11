import { useQuery } from "@tanstack/vue-query";
import type { Feature, Point } from "geojson";

import type { MarkerProperties, MarkersType, QueryDescription } from "@/lib/api-client/Api";

export function useGeoMarkers(params: MaybeRef<QueryDescription>, options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-markers", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const { endpoint, query, scope } = params as Required<QueryDescription>; // FIXME: backend

			// FIXME: every endpoint should have a separate method in the api client
			const response =
				endpoint === "bibl_markers_tei"
					? await api.vicav.getMarkers(
							{ query, scope },
							{ headers: { accept: "application/json" } },
					  )
					: await api.vicav.getGeoMarkers(
							// FIXME: QueryDescription['endpoint'] should be the same as MarkersType
							endpoint.slice(0, "_markers".length * -1) as MarkersType,
							{ headers: { accept: "application/json" } },
					  );

			return response.data as Array<Feature<Point, MarkerProperties>>;
		},
	});
}
