import { isNonEmptyString } from "@acdh-oeaw/lib";

import { isWindowType, windowTypeMap } from "@/utils/is-window-type";

export function useAnchorClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow } = windowsStore;

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromAnchor(event: MouseEvent) {
		const element = event.target;

		if (element instanceof HTMLAnchorElement) {
			const { label, targetType, textId, queryString, endpoint } = element.dataset;

			if (!isWindowType(targetType)) return;
			if (
				(["Text", "Profile", "Feature"].includes(targetType) && textId == null) ||
				(targetType === "WMap" && endpoint == null)
			)
				return;

			event.preventDefault();

			let title = isNonEmptyString(label) ? label : element.innerText;
			const kind = windowTypeMap[targetType];

			let params;
			switch (targetType) {
				case "Text":
				case "Profile":
				case "Feature":
					params = { id: textId };
					break;
				case "BiblioEntries":
					params = { query: queryString };
					break;
				case "WMap":
					title = `BiblioEntries: ${queryString}`;
					params = { endpoint, query: queryString, id: "BiblGeoMarkers" };
					break;
				default:
					return;
			}

			addWindow({
				title,
				kind,
				params,
			});
		}
	}

	return openNewWindowFromAnchor;
}
