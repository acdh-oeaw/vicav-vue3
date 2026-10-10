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

	watch(
		[() => dataListMapStore.layers, mapWindow],
		([layerRecord, window], [previousLayers]) => {
			const layers = Object.values(layerRecord);
			if (window) {
				const mergedLayers = dataListMapStore.mergeMapLayers(window.params.dataListLayers);
				if (JSON.stringify(window.params.dataListLayers) !== JSON.stringify(mergedLayers)) {
					windowsStore.updateWindowParams(window.id, {
						...window.params,
						dataListLayers: mergedLayers,
					});
				}
			} else if (
				previousLayers &&
				layers.some(
					(layer) => layer.enabled !== false && previousLayers[layer.id]?.enabled !== true,
				)
			) {
				windowsStore.addWindow({
					targetType: "WMap",
					title: "Data lists map",
					params: { endpoint: "data_markers", queryString: "", dataListLayers: layers },
				});
			}
		},
		{ immediate: true },
	);
}
