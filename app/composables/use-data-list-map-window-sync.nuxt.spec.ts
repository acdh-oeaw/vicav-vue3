// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, reactive } from "vue";

import type { WindowRegistry, WindowState } from "@/stores/use-windows-store.ts";
import type { DataListMapLayer, OpenWindowItem, WindowItem } from "@/types/global.ts";

import { useDataListMapWindowSync } from "./use-data-list-map-window-sync.ts";

const mocks = vi.hoisted(() => ({
	dataLists: { layers: {}, mergeMapLayers: () => [] as Array<DataListMapLayer> },
	windows: {
		registry: new Map() as WindowRegistry,
		addWindow: vi.fn<(state: WindowState) => void>(),
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

function mapWindow(): OpenWindowItem {
	return {
		id: "map",
		label: "Data lists map",
		targetType: "WMap",
		params: { endpoint: "data_markers", queryString: "" },
		winbox: {},
	} as OpenWindowItem;
}

describe("data list map window synchronization", () => {
	let scope: ReturnType<typeof effectScope>;

	beforeEach(() => {
		mocks.dataLists = reactive({
			layers: {},
			mergeMapLayers: () => Object.values(mocks.dataLists.layers),
		});
		mocks.windows.registry = reactive(new Map());
		mocks.windows.addWindow.mockReset();
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
