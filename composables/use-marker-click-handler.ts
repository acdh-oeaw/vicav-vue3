import type { Feature, Point } from "geojson";

import type { MarkerProperties } from "@/components/geo-map.context";

export function useMarkerClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow } = windowsStore;

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromMarker(feature: Feature<Point, MarkerProperties>) {
		const item = feature.properties;
		addWindow({
			targetType: item.targetType,
			params: item,
			title: item.name ? item.name : "",
		} as WindowState);
	}

	return openNewWindowFromMarker;
}
