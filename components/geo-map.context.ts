import type { Point } from "geojson";
import type { GeoJSON, Map as LeafletMap, TileLayer } from "leaflet";
import type { InjectionKey } from "vue";

import type { MarkerProperties } from "@/lib/api-client/Api";

export type { MarkerProperties };

export interface GeoMapContext {
	map: LeafletMap | null;
	baseLayer: TileLayer | null;
	featureGroups: {
		markers: GeoJSON<MarkerProperties, Point> | null;
	};
}

export const key = Symbol() as InjectionKey<GeoMapContext>;
