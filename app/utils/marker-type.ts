import { MarkersType } from "@/lib/api-client";

const markerTypes: Record<string, MarkersType> = {
	data: MarkersType.Data,
	sample: MarkersType.Sample,
	bibl: MarkersType.Bibl,
	profile: MarkersType.Profile,
	dict: MarkersType.Dict,
	feature: MarkersType.Feature,
};

export function markerTypeFromEndpoint(endpoint: string): MarkersType {
	const name = endpoint.slice(0, -"_markers".length);
	const markerType = markerTypes[name];
	if (markerType == null) throw new Error(`Unknown marker endpoint: ${endpoint}`);
	return markerType;
}
