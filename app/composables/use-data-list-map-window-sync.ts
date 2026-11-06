import { computed, watch } from "vue";

import { useDataListMapStore } from "@/stores/use-data-list-map-store.ts";
import { useWindowsStore } from "@/stores/use-windows-store.ts";
import type { OpenWindowItem } from "@/types/global.ts";

export function useDataListMapWindowSync() {
	const dataListMapStore = useDataListMapStore();
	const windowsStore = useWindowsStore();
	const mapWindow = computed(() =>
		[...windowsStore.registry.values()].find(
			(window): window is Extract<OpenWindowItem, { targetType: "WMap" }> =>
				window.targetType === "WMap" && window.params.endpoint === "data_markers",
		),
	);
	const initialEnabledApplied = new Set<string>();

	watch(
		[() => dataListMapStore.layers, mapWindow],
		([layerRecord, window], [previousLayers]) => {
			const layers = Object.values(layerRecord);
			const newlyEnabled =
				previousLayers &&
				layers.some(
					(layer) => layer.enabled !== false && previousLayers[layer.id]?.enabled !== true,
				);
			if (window) {
				if (
					layers.length > 0 &&
					window.params.enabledDatasets &&
					!initialEnabledApplied.has(window.id)
				) {
					initialEnabledApplied.add(window.id);
					dataListMapStore.applyInitialEnabled(window.params.enabledDatasets);
				}
				const mergedLayers = dataListMapStore.mergeMapLayers(window.params.dataListLayers);
				if (JSON.stringify(window.params.dataListLayers) !== JSON.stringify(mergedLayers)) {
					windowsStore.updateWindowParams(window.id, {
						...window.params,
						dataListLayers: mergedLayers,
					});
				}
				if (newlyEnabled) windowsStore.arrangeDataListsAndMap();
			} else if (newlyEnabled) {
				windowsStore.addWindow({
					targetType: "WMap",
					title: "Data lists map",
					params: { endpoint: "data_markers", queryString: "", dataListLayers: layers },
				});
				windowsStore.arrangeDataListsAndMap();
			}
		},
		{ immediate: true },
	);
}
