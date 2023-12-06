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
			const { label, targetType, textId, endpoint } = element.dataset;
			console.log(element.dataset);

			if (!isWindowType(targetType)) return;
			if (
				(["Text", "Profile", "Feature"].includes(targetType) && textId == null) ||
				(targetType === "WMap" && endpoint == null)
			)
				return;

			event.preventDefault();

			const kind = windowTypeMap[targetType];

			let params;
			switch (targetType) {
				case "Text":
				case "Profile":
				case "Feature":
					params = { id: textId };
					break;
				case "Bibl":
					params = { query: element.dataset["query-1"] };
					break;
				default:
					return;
			}

			addWindow({
				title: isNonEmptyString(label) ? label : element.innerText,
				kind,
				params,
			});
		}
	}

	return openNewWindowFromAnchor;
}
