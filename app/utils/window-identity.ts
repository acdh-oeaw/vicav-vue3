import type { z } from "zod";

import type { Schema } from "@/types/global";

export function getWindowIdentity(window: z.infer<typeof Schema>): string | undefined {
	let parts: Array<unknown>;
	switch (window.targetType) {
		case "ExploreSamples":
			parts = [window.params.dataType];
			break;
		case "WMap": {
			const map = window.params;
			parts =
				map.endpoint === "compare_markers"
					? [map.endpoint, map.queryParams?.type]
					: map.endpoint === "data_markers"
						? [map.endpoint]
						: [map.endpoint, map.queryString, [...new Set(map.scope ?? [])].sort()];
			break;
		}
		case "BiblioEntries":
		case "ListMap":
			parts = [window.params.queryString];
			break;
		case "CorpusQuery":
			parts = [window.params.queryString, window.params.mode ?? "text"];
			break;
		case "GeojsonMap":
			parts = [window.params.markerType];
			break;
		case "FeatureStatistics":
			parts = [window.params.featureId];
			break;
		case "Location":
			parts = [window.params.id];
			break;
		case "DictQuery":
		case "CorpusText":
		case "Feature":
		case "Profile":
		case "Text":
		case "SampleText":
		case "DataList":
		case "FeatureDescriptionList":
		case "DataTable":
		case "ExploreSamplesForm":
			parts = [window.params.textId];
			break;
		case "FeatureValue":
			return;
	}
	return parts.some((part) => part == null)
		? undefined
		: JSON.stringify([window.targetType, ...parts]);
}
