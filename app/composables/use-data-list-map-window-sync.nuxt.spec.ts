// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, reactive } from "vue";

import type { WindowRegistry, WindowState } from "@/stores/use-windows-store.ts";
import type { DataListMapLayer, OpenWindowItem, WindowItem } from "@/types/global.ts";

import { useDataListMapWindowSync } from "./use-data-list-map-window-sync.ts";

const mocks = vi.hoisted(() => ({
	dataLists: {
		layers: {},
		mergeMapLayers: () => [] as Array<DataListMapLayer>,
		applyInitialEnabled: vi.fn<(ids: Array<string> | undefined) => void>(),
	},
	windows: {
		registry: new Map() as WindowRegistry,
		addWindow: vi.fn<(state: WindowState) => void>(),
		arrangeDataListsAndMap: vi.fn(),
		updateWindowParams: vi.fn<(id: string, params: WindowItem["params"]) => void>(),
	},
}));

vi.mock("@/stores/use-data-list-map-store.ts", () => ({
	useDataListMapStore: () => mocks.dataLists,
}));
vi.mock("@/stores/use-windows-store.ts", () => ({
	useWindowsStore: () => mocks.windows,
}));

function layer(enabled = true): DataListMapLayer {
	return { id: "samples", title: "Samples", color: "#b91c1c", enabled, markers: [] };
}

function setLayers(layers: Record<string, DataListMapLayer>) {
	mocks.dataLists.layers = layers;
}

function mapWindow(extraParams: Record<string, unknown> = {}): OpenWindowItem {
	return {
		id: "map",
		label: "Data lists map",
		targetType: "WMap",
		params: { endpoint: "data_markers", queryString: "", ...extraParams },
		winbox: {},
	} as OpenWindowItem;
}

describe("data list map window synchronization", () => {
	let scope: ReturnType<typeof effectScope>;

	beforeEach(() => {
		mocks.dataLists = reactive({
			layers: {},
			mergeMapLayers: () => Object.values(mocks.dataLists.layers),
			applyInitialEnabled: mocks.dataLists.applyInitialEnabled,
		});
		mocks.windows.registry = reactive(new Map());
		mocks.dataLists.applyInitialEnabled.mockReset();
		mocks.windows.addWindow.mockReset();
		mocks.windows.arrangeDataListsAndMap.mockReset();
		mocks.windows.updateWindowParams.mockReset();
		mocks.windows.addWindow.mockImplementation((state) => {
			const window = { ...mapWindow(), params: state.params } as OpenWindowItem;
			mocks.windows.registry.set(window.id, window);
		});
		mocks.windows.updateWindowParams.mockImplementation((id, params) => {
			const window = mocks.windows.registry.get(id);
			if (window) window.params = params;
		});
		scope = effectScope();
	});

	afterEach(() => {
		scope.stop();
	});

	it("opens a map when a dataset is enabled and updates it without a list component", async () => {
		scope.run(useDataListMapWindowSync);
		setLayers({ samples: layer() });
		await nextTick();
		expect(mocks.windows.addWindow).toHaveBeenCalledTimes(1);
		expect(mocks.windows.arrangeDataListsAndMap).toHaveBeenCalledTimes(1);
		expect(mocks.windows.addWindow).toHaveBeenCalledWith({
			targetType: "WMap",
			title: "Data lists map",
			params: { endpoint: "data_markers", queryString: "", dataListLayers: [layer()] },
		});

		mocks.windows.updateWindowParams.mockClear();
		setLayers({ samples: layer(false) });
		await nextTick();
		expect(mocks.windows.updateWindowParams).toHaveBeenCalledTimes(1);
		expect(mocks.windows.updateWindowParams).toHaveBeenCalledWith("map", {
			endpoint: "data_markers",
			queryString: "",
			dataListLayers: [layer(false)],
		});
	});

	it("hydrates reopened maps and keeps a closed map closed until a layer is enabled", async () => {
		setLayers({ samples: layer() });
		scope.run(useDataListMapWindowSync);
		expect(mocks.windows.addWindow).not.toHaveBeenCalled();
		mocks.windows.registry.set("map", mapWindow());
		await nextTick();
		expect(mocks.windows.updateWindowParams).toHaveBeenCalledWith("map", {
			endpoint: "data_markers",
			queryString: "",
			dataListLayers: [layer()],
		});

		mocks.windows.registry.delete("map");
		await nextTick();
		setLayers({ samples: { ...layer(), title: "Updated samples" } });
		await nextTick();
		expect(mocks.windows.addWindow).not.toHaveBeenCalled();
		setLayers({ samples: layer(false) });
		await nextTick();
		setLayers({ samples: layer() });
		await nextTick();
		expect(mocks.windows.addWindow).toHaveBeenCalledTimes(1);
	});

	it("applies enabledDatasets once per window as an initial default", async () => {
		scope.run(useDataListMapWindowSync);
		mocks.windows.registry.set("map", mapWindow({ enabledDatasets: ["samples"] }));
		await nextTick();
		expect(mocks.dataLists.applyInitialEnabled).not.toHaveBeenCalled();
		setLayers({ samples: layer(false) });
		await nextTick();
		expect(mocks.dataLists.applyInitialEnabled).toHaveBeenCalledTimes(1);
		expect(mocks.dataLists.applyInitialEnabled).toHaveBeenCalledWith(["samples"]);
		setLayers({ samples: layer(true) });
		await nextTick();
		setLayers({ samples: layer(false) });
		await nextTick();
		expect(mocks.dataLists.applyInitialEnabled).toHaveBeenCalledTimes(1);
	});

	it("does not touch datasets for maps without an enabledDatasets param", async () => {
		scope.run(useDataListMapWindowSync);
		mocks.windows.registry.set("map", mapWindow());
		setLayers({ samples: layer(false) });
		await nextTick();
		expect(mocks.dataLists.applyInitialEnabled).not.toHaveBeenCalled();
	});

	it("stops synchronization when the window manager scope ends", async () => {
		mocks.windows.registry.set("map", mapWindow());
		scope.run(useDataListMapWindowSync);
		mocks.windows.updateWindowParams.mockClear();
		scope.stop();
		setLayers({ samples: layer() });
		await nextTick();
		expect(mocks.windows.updateWindowParams).not.toHaveBeenCalled();
		expect(mocks.windows.addWindow).not.toHaveBeenCalled();
	});
});
