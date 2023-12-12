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
			const { label, targetType, textId } = element.dataset;

			if (textId == null) return;
			if (!isWindowType(targetType)) return;

			event.preventDefault();

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const kind = windowTypeMap[String(targetType)]!;
			const params = { id: textId };

			addWindow({
				title: isNonEmptyString(label) ? label : element.innerText,
				kind,
				params,
			});
		}
	}

	return openNewWindowFromAnchor;
}
