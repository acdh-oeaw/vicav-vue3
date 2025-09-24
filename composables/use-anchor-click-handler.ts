import { isNonEmptyString } from "@acdh-oeaw/lib";

import type { WindowItem } from "@/types/global";

export function useAnchorClickHandler() {
	const openOrUpdateWindow = useOpenOrUpdateWindow();

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromAnchor(event: MouseEvent) {
		const element = event.target as HTMLElement;

		let anchorDataRecord: Record<string, string> = {};
		if (element instanceof HTMLAnchorElement) {
			anchorDataRecord = element.dataset as Record<string, string>;
		} else if (element.parentElement instanceof HTMLAnchorElement) {
			anchorDataRecord = element.parentElement.dataset as Record<string, string>;
		}

		const anchorDataObject = jsonStringsToObject(anchorDataRecord);
		anchorDataObject.label = isNonEmptyString(anchorDataObject.label)
			? anchorDataObject.label
			: element.innerText;
		// Replacement for itemWrapper? Part of fix for #252?
		anchorDataObject.params ??= structuredClone(anchorDataObject);

		if (anchorDataObject.targetType) {
			if (anchorDataObject.targetType === "External-link") return;
			event.preventDefault();

			openOrUpdateWindow(
				anchorDataObject as unknown as WindowItem, // TODO: can we safeParse this?
				anchorDataObject.label,
			);
		}
	}

	return openNewWindowFromAnchor;
}
