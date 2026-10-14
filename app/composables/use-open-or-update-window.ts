import type { WindowItem } from "@/types/global.ts";

export function useOpenOrUpdateWindow() {
	const windowsStore = useWindowsStore();
	return (item: WindowItem, title: string, highlight = false) =>
		windowsStore.openWindow({ ...item, title }, { highlight });
}
