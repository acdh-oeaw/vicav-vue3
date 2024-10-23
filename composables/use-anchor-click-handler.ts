import { isNonEmptyString } from "@acdh-oeaw/lib";

export function useAnchorClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow } = windowsStore;

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
			addWindow({
				targetType: item.targetType,
				params: jsonStringsToObject(item),
				title: isNonEmptyString(item.label) ? item.label : element.innerText,
			} as WindowState);
		}
	}

	return openNewWindowFromAnchor;
}
