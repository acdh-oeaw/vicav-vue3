import { TextId, type WindowItem } from "@/types/global.d";

export function useOpenOrUpdateWindow() {
	const windowsStore = useWindowsStore();
	const { addWindow, findWindowByTypeAndParam } = windowsStore;

	const { data: config } = useProjectInfo();
	return function (item: WindowItem, title: string) {
		const ci = TextId.safeParse(item.params);
		if (ci.success) {
			const targetConfig = config.value?.projectConfig?.menu?.main
				?.flatMap((menuEntry) => menuEntry.item)
				.find((menuEntry) => {
					return menuEntry.id === ci.data.textId;
				});

			const window = findWindowByTypeAndParam(item.targetType, "textId", ci.data.textId);
			if (window) {
				const windowItem = window;
				const originalParams: object = window.params as object;
				windowItem.params = { ...originalParams, ...(item.params as object) };
				windowItem.winbox.focus();
				return;
			}

			if (targetConfig) {
				addWindow({
					...targetConfig,
					params: { ...targetConfig.params, ...(item.params ?? item) },
					title: title,
				} as WindowState);
			} else {
				addWindow({
					targetType: item.targetType,
					params: item.params ?? item,
					title: title,
				} as WindowState);
			}
		} else
			addWindow({
				targetType: item.targetType,
				params: item.params ?? item,
				title: title,
			} as WindowState);
	};
}
