import { isNonEmptyString } from "@acdh-oeaw/lib";

export function useAnchorClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow } = windowsStore;

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromAnchor(event: MouseEvent) {
		const element = event.target as HTMLElement;

		let item: Record<string, string> = {};
		if (element instanceof HTMLAnchorElement) {
			item = element.dataset as Record<string, string>;
		} else if (element.parentElement instanceof HTMLAnchorElement) {
			item = element.parentElement.dataset as Record<string, string>;
		}

		const params = jsonStringsToObject(item);
		params.label = isNonEmptyString(params.label) ? params.label : element.innerText;
		if (item.targetType) {
			if (item.targetType === "External-link") return;
			event.preventDefault();
			addWindow({
				targetType: params.targetType,
				params: params,
				title: params.label,
			} as WindowState);
		}
	}

	return openNewWindowFromAnchor;
}
