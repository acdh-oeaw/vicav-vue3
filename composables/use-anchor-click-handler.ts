import { isNonEmptyString } from "@acdh-oeaw/lib";

import type { WindowItem } from "@/types/global";

export function useAnchorClickHandler() {
	const openOrUpdateWindow = useOpenOrUpdateWindow();

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromAnchor(event: MouseEvent) {
		const element = event.target as HTMLElement;

		let item: Record<string, string> | null = null;
		if (element instanceof HTMLAnchorElement) {
			item = element.dataset as Record<string, string>;
		} else if (element.parentElement instanceof HTMLAnchorElement) {
			item = element.parentElement.dataset as Record<string, string>;
		}

		if (item?.targetType) {
			if (item.targetType === "External-link") return;
			event.preventDefault();

			let itemWrapper;
			if (!item.params) {
				itemWrapper = {
					targetType: item.targetType,
					params: item,
				};
			} else {
				itemWrapper = item;
			}

			openOrUpdateWindow(
				itemWrapper as WindowItem,
				isNonEmptyString(item.label) ? item.label : element.innerText,
			);
		}
	}

	return openNewWindowFromAnchor;
}
