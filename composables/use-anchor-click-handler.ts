import { isWindowType, windowTypeMap } from "@/utils/is-window-type";

export function useAnchorClickHandler() {
	const windowsStore = useWindowsStore();
	const { addWindow } = windowsStore;

	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function onClick(event: MouseEvent) {
		const element = event.target;

		if (element instanceof HTMLAnchorElement) {
			const { id, targetType } = element.dataset;

			if (id == null) return;
			if (!isWindowType(targetType)) return;

			event.preventDefault();

			const kind = windowTypeMap[targetType];
			const params = { id };

			addWindow({
				title: element.innerText,
				kind,
				params,
			});
		}
	}

	return onClick;
}
