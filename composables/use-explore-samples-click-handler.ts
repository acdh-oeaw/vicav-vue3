export default function useExploreSamplesClickHandler(
	features: Ref<Array<string>>,
	page: Ref<number>,
) {
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

		if (item?.targetWindow === "self") {
			const dataFeatures = item.features?.split(",");
			if (dataFeatures) features.value = dataFeatures;
			if (item.page) page.value = parseInt(item.page);
		} else {
			openNewWindowFromAnchor(event);
		}
	};
}
