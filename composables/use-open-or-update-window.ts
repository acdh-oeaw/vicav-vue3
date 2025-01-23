import type { WindowItem } from "@/types/global";

export function useOpenOrUpdateWindow() {
	const windowsStore = useWindowsStore();
	const { addWindow, findWindowByTypeAndParam } = windowsStore;

	const { data: config } = useProjectInfo();
	return function (item: WindowItem, title: string) {
		if (item.params.textId) {
			const targetConfig = config.value?.projectConfig?.menu?.main
				?.flatMap((menuEntry) => menuEntry.item)
				.find((menuEntry) => {
					return menuEntry.id === item.params.textId;
				});

			const window = findWindowByTypeAndParam(
				item.targetType,
				"textId",
				item.params.textId as string,
			);
			if (window) {
				const originalParams: object = window.params as object;
				window.params = { ...originalParams, ...item.params };
				window.winbox.focus();
				return;
			}

			if (targetConfig) {
				addWindow({
					...targetConfig,
					params: { ...targetConfig.params, ...(item.params ? item.params : item) },
					title: title,
				} as WindowState);
			} else {
				addWindow({
					targetType: item.targetType,
					params: item.params ? item.params : item,
					title: title,
				} as WindowState);
			}
		} else
			addWindow({
				targetType: item.targetType,
				params: item.params ? item.params : item,
				title: title,
			} as WindowState);
	};
}
