import { isNonEmptyString } from "@acdh-oeaw/lib";

export function useAnchorClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow } = windowsStore;

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function openNewWindowFromAnchor(event: MouseEvent) {
		console.log(event);
		const element = event.target as HTMLElement;

		let item: Record<string, string> | null = null;
		console.log(element);
		if (element instanceof HTMLAnchorElement) {
			item = element.dataset as Record<string, string>;
		} else if (element.parentElement instanceof HTMLAnchorElement) {
			item = element.parentElement.dataset as Record<string, string>;
		}
		console.log(item);

		if (item.targetType) {
			if (item.targetType === "External-link") return;
			event.preventDefault();
			addWindow({
				targetType: item.targetType,
				params: item,
				title: isNonEmptyString(item.label) ? item.label : element.innerText,
			} as WindowState);
		}
	}

	return openNewWindowFromAnchor;
}
