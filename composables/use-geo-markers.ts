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
			const { endpoint, queryString, scope } = params;

			const response =
				endpoint === "bibl_markers_tei"
					? await api.vicav.getMarkers(
							{ query: queryString, scope: scope ?? [] }, // TODO: fix unmatching parameter object in schema and api
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
