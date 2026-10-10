import { useDataListMapStore } from "@/stores/use-data-list-map-store.ts";
import { useWindowsStore } from "@/stores/use-windows-store.ts";
import type { OpenWindowItem } from "@/types/global.ts";

export function useDataListWindowToggle() {
	const datasetsStore = useDataListMapStore();
	const windowsStore = useWindowsStore();
	const listsByDataset = computed(() => {
		const lists = new Map<string, Array<OpenWindowItem>>();
		for (const window of windowsStore.registry.values()) {
			if (window.targetType !== "DataList") continue;
			const id = datasetsStore.resolveDatasetId(
				window.params.mapSyncId ?? window.id,
				window.params,
			);
			const matches = lists.get(id) ?? [];
			matches.push(window);
			lists.set(id, matches);
		}
		return lists;
	});

	function isListOpen(id: string): boolean {
		return listsByDataset.value.has(id);
	}

	function toggleList(id: string): void {
		const record = datasetsStore.records[id];
		if (!record) return;
		const lists = listsByDataset.value.get(id);
		if (lists?.length) {
			for (const window of lists) windowsStore.removeWindow(window.id);
			return;
		}
		windowsStore.addWindow({
			targetType: "DataList",
			title: record.title,
			params: {
				dataTypes: [...record.definition.dataTypes],
				filterListBy: record.definition.filterListBy,
				listState: record.listState,
				mapSyncId: id,
				mapEnabled: record.enabled,
			},
		});
	}

	return { isListOpen, toggleList };
}
