import type { Feature, Point } from "geojson";

import type { MarkerProperties } from "@/components/geo-map.context";
import type { WindowItemTargetType } from "@/types/global";

export function useMarkerClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow, findWindowByTypeAndTitle } = windowsStore;

	const { data: config } = useProjectInfo();

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromMarker(feature: Feature<Point, MarkerProperties>) {
		const item = { ...feature.properties };

		// if the marker has a targetId referring to an entry in the navbar (defined in projectConfig),
		// update the corresponding window or open it if it's not open yet
		if (item.targetId) {
			const targetConfig = config.value?.projectConfig?.menu?.main
				?.flatMap((menuEntry) => menuEntry.item)
				.find((menuEntry) => menuEntry.id === item.targetId);

			if (!targetConfig) return;

			const window = findWindowByTypeAndTitle(
				targetConfig.targetType as WindowItemTargetType,
				targetConfig.title ?? "",
			);
			if (window) {
				const originalParams: object = window.params as object;
				window.params = { ...originalParams, ...item.params };
				window.winbox.focus();
				return;
			}

			addWindow({
				...targetConfig,
				params: { ...targetConfig.params, ...item.params },
			} as WindowState);
		} else
			addWindow({
				targetType: item.targetType,
				params: item.params ? item.params : item,
				title: item.name ? item.name : "",
			} as WindowState);
	}

	return openNewWindowFromMarker;
}
