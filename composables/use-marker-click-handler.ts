import type { Feature, Point } from "geojson";

import type { MarkerProperties } from "@/components/geo-map.context";
import type { WindowItem } from "@/types/global";

export function useMarkerClickHandler() {
	const openOrUpdateWindow = useOpenOrUpdateWindow();

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromMarker(feature: Feature<Point, MarkerProperties>) {
		const item = { ...feature.properties };

		// if the marker has a targetId referring to an entry in the navbar (defined in projectConfig),
		// update the corresponding window or open it if it's not open yet
		openOrUpdateWindow(item as unknown as WindowItem, item.name ?? "");
	}

	return openNewWindowFromMarker;
}
