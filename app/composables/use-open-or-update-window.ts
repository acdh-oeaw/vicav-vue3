import type { ZodObject } from "zod";

import { TextId, type WindowItem } from "@/types/global.ts";

export function useOpenOrUpdateWindow() {
	const windowsStore = useWindowsStore();

	const { data: config } = useProjectInfo();
	return function (
		item: WindowItem,
		title: string,
		type: ZodObject = TextId,
		paramName = "textId",
		highlight = false,
	) {
		const { addWindow, findWindowByTypeAndParam } = windowsStore;
		const ci = type.safeParse(item.params);
		if (ci.success) {
			const targetConfig = config.value?.projectConfig?.menu?.main
				?.flatMap((menuEntry) => menuEntry.item)
				.find((menuEntry) => {
					return menuEntry.id === ci.data[paramName];
				});

			const window = findWindowByTypeAndParam(
				item.targetType,
				paramName,
				String(ci.data[paramName]),
			);
			if (window) {
				const windowItem = window;
				const originalParams: object = window.params;
				windowItem.params = {
					...originalParams,
					...(item.params as object),
				} as WindowItem["params"];
				windowItem.winbox.focus();
				if (highlight) {
					windowItem.winbox.addClass("highlighted");
					setTimeout(() => {
						windowItem.winbox.removeClass("highlighted");
					}, 1000);
				}
				return;
			}

			if (targetConfig) {
				addWindow({
					...targetConfig,
					params: { ...targetConfig.params, ...item.params },
					title: title,
				} as WindowState);
			} else {
				addWindow({
					targetType: item.targetType,
					params: item.params,
					title: title,
				} as WindowState);
			}
		} else
			addWindow({
				targetType: item.targetType,
				params: item.params,
				title: title,
			} as WindowState);
	};
}
