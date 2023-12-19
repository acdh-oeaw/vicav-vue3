import { isNonEmptyString } from "@acdh-oeaw/lib";

export function useAnchorClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow } = windowsStore;

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromAnchor(event: MouseEvent) {
		const element = event.target;

		if (element instanceof HTMLAnchorElement) {
			const item = element.dataset;

			event.preventDefault();

			addWindow({
				kind: item.targetType,
				params: item,
				title: isNonEmptyString(item.label) ? item.label : element.innerText,
			} as WindowState);
		}
	}

	return openNewWindowFromAnchor;
}
