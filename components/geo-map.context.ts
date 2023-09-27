import type { Point } from "geojson";
import type { GeoJSON, Map as LeafletMap, TileLayer } from "leaflet";
import type { InjectionKey } from "vue";

// TODO: this should come from api client types
export interface PointProperties {
	type: "geo" | "reg";
	name: string;
	hitCount: string;
}

export interface GeoMapContext {
	map: LeafletMap | null;
	baseLayer: TileLayer | null;
	featureGroups: {
		markers: GeoJSON<PointProperties, Point> | null;
	};
}

export const key = Symbol() as InjectionKey<GeoMapContext>;
