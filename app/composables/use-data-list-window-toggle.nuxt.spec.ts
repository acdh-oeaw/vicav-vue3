// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, reactive } from "vue";

import type { WindowRegistry, WindowState } from "@/stores/use-windows-store.ts";
import type { OpenWindowItem } from "@/types/global.ts";

import { useDataListWindowToggle } from "./use-data-list-window-toggle.ts";

const mocks = vi.hoisted(() => ({
	datasets: {
		records: {
			samples: {
				title: "Sample texts",
				definition: {
					dataTypes: ["SampleText"],
					filterListBy: { key: "country", value: "Tunisia" },
				},
				listState: { globalFilter: "retained search" },
				enabled: true,
			},
		},
		resolveDatasetId: vi.fn(() => "samples"),
	},
	windows: {
		registry: new Map() as WindowRegistry,
		addWindow: vi.fn<(state: WindowState) => void>(),
		removeWindow: vi.fn<(id: string) => void>(),
	},
}));
vi.mock("@/stores/use-data-list-map-store.ts", () => ({
	useDataListMapStore: () => mocks.datasets,
}));
vi.mock("@/stores/use-windows-store.ts", () => ({ useWindowsStore: () => mocks.windows }));

function listWindow(id: string): OpenWindowItem {
	return { id, targetType: "DataList", params: { dataTypes: ["SampleText"] } } as OpenWindowItem;
}

beforeEach(() => {
	mocks.datasets.records.samples.enabled = true;
	mocks.windows.registry = reactive(new Map());
	mocks.windows.addWindow.mockReset();
	mocks.windows.removeWindow.mockReset();
	mocks.windows.removeWindow.mockImplementation((id) => {
		mocks.windows.registry.delete(id);
	});
});

describe("dataset list window toggling", () => {
	it.each([false, true])("opens a list without changing its layer (enabled=%s)", (enabled) => {
		mocks.datasets.records.samples.enabled = enabled;
		const scope = effectScope();
		const toggle = scope.run(useDataListWindowToggle)!;
		expect(toggle.isListOpen("samples")).toBe(false);
		toggle.toggleList("samples");
		expect(mocks.windows.addWindow).toHaveBeenCalledWith({
			targetType: "DataList",
			title: "Sample texts",
			params: {
				dataTypes: ["SampleText"],
				filterListBy: { key: "country", value: "Tunisia" },
				listState: { globalFilter: "retained search" },
				mapSyncId: "samples",
				mapEnabled: enabled,
			},
		});
		expect(mocks.datasets.records.samples.enabled).toBe(enabled);
		scope.stop();
	});

	it("closes all matching lists and tracks window closure independently of the layer", () => {
		const scope = effectScope();
		const toggle = scope.run(useDataListWindowToggle)!;
		mocks.windows.registry.set("first", listWindow("first"));
		mocks.windows.registry.set("second", listWindow("second"));
		mocks.windows.registry.set("map", {
			id: "map",
			targetType: "WMap",
			params: { endpoint: "data_markers", queryString: "" },
		} as OpenWindowItem);
		expect(toggle.isListOpen("samples")).toBe(true);
		toggle.toggleList("samples");
		expect(mocks.windows.removeWindow.mock.calls).toEqual([["first"], ["second"]]);
		expect(toggle.isListOpen("samples")).toBe(false);
		expect(mocks.windows.registry.has("map")).toBe(true);
		expect(mocks.datasets.records.samples.enabled).toBe(true);
		scope.stop();
	});

	it("ignores layers without a registered dataset", () => {
		const scope = effectScope();
		const toggle = scope.run(useDataListWindowToggle)!;
		toggle.toggleList("unknown");
		expect(mocks.windows.addWindow).not.toHaveBeenCalled();
		expect(mocks.windows.removeWindow).not.toHaveBeenCalled();
		scope.stop();
	});
});
