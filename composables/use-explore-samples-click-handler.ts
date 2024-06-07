export default function useExploreSamplesClickHandler(features: Ref<Array<string>>) {
	const openNewWindowFromAnchor = useAnchorClickHandler();
	return function (event: MouseEvent) {
		const element = event.target as HTMLElement;

		let item;
		if (element instanceof HTMLAnchorElement) {
			item = element.dataset as Record<string, string>;
		} else if (element.parentElement instanceof HTMLAnchorElement) {
			item = element.parentElement.dataset as Record<string, string>;
		} else if (element instanceof HTMLInputElement) {
			item = element.dataset as Record<string, string>;
			item[element.name] = element.value;
		}

		if (item.targetWindow && item.targetWindow === "self") {
			features.value = item.features?.split(",");
		} else {
			openNewWindowFromAnchor(event);
		}
	};
}
