// @vitest-environment nuxt
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isReactive, nextTick, reactive } from "vue";

import { useOpenOrUpdateWindow } from "@/composables/use-open-or-update-window";
import { decodeWindowStates, encodeWindowStates } from "@/utils/window-state-codec";

import { useWindowsStore, type WindowState } from "./use-windows-store";

interface MockOptions {
	id: string;
	title: string;
	width?: number;
	index?: number;
	onclose: () => boolean;
	onfocus: () => void;
	onmove: () => void;
	onresize: () => void;
}
interface MockWindow {
	options: MockOptions;
	x: number;
	width: number;
	classes: Set<string>;
}
interface Navigation {
	path: string;
	query: Record<string, string>;
}
let disposeStore: (() => void) | undefined;
const mocks = vi.hoisted(() => ({
	route: { path: "/", query: {} },
	navigate: vi.fn<(location: Navigation) => Promise<void> | void>(),
	windows: [] as Array<MockWindow>,
}));
mockNuxtImport("useProjectInfo", () => () => ({
	data: {
		value: {
			projectConfig: {
				menu: {
					main: [
						{
							item: [
								{
									id: "li_configured",
									targetType: "Text",
									width: 600,
									params: { textId: "configured", showCitation: true },
								},
							],
						},
					],
				},
				panel: [{ targetType: "Text", title: "Initial", params: { textId: "initial" } }],
			},
		},
	},
	suspense: () => Promise.resolve(),
}));
mockNuxtImport("useGeojsonStore", () => () => ({ table: undefined }));
mockNuxtImport("useRoute", () => vi.fn());
mockNuxtImport("useRouter", () => vi.fn());
mockNuxtImport("navigateTo", () => vi.fn());
vi.mock("winbox", () => ({
	default: class {
		id: string;
		title: string;
		index = 1;
		x = 0;
		y = 0;
		width = 400;
		height = 300;
		dom = document.createElement("div");
		body = document.createElement("div");
		classes = new Set<string>();
		constructor(public options: MockOptions) {
			this.id = options.id;
			this.title = options.title;
			mocks.windows.push(this);
		}
		addControl() {
			return undefined;
		}
		addClass(name: string) {
			this.classes.add(name);
		}
		removeClass(name: string) {
			this.classes.delete(name);
		}
		focus() {
			return undefined;
		}
		setTitle(title: string) {
			this.title = title;
		}
		close() {
			this.options.onclose();
		}
		resize() {
			return this;
		}
		move() {
			return this;
		}
	},
}));
vi.mock("@/utils/window-arrangement", () => ({
	maximize: vi.fn(),
	none: vi.fn(),
	smartTile: vi.fn(),
	splitDataListsAndMap: vi.fn(),
}));
vi.mock("@/utils/window-body-focus.ts", () => ({
	enableWindowBodyKeyboardScrollFocus: vi.fn(),
	focusWindowBodyKeyboardScrollTarget: vi.fn(),
}));

async function persist() {
	await nextTick();
	await vi.advanceTimersByTimeAsync(150);
	await nextTick();
}
function text(title = "Text") {
	return { targetType: "Text" as const, params: { textId: "one" }, title };
}

describe("window opening and persistence", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(navigateTo).mockImplementation((location) => mocks.navigate(location as Navigation));
		vi.mocked(useRoute).mockImplementation(
			() => reactive(mocks.route) as ReturnType<typeof useRoute>,
		);
		vi.mocked(useRouter).mockImplementation(
			() => ({ push: mocks.navigate }) as unknown as ReturnType<typeof useRouter>,
		);
		setActivePinia(createPinia());
		mocks.navigate.mockReset();
		mocks.windows.length = 0;
		mocks.route.path = "/";
		mocks.route.query = {};
		const root = document.createElement("div");
		root.id = windowRootId;
		root.getBoundingClientRect = () => ({ width: 1200, height: 800 }) as DOMRect;
		document.body.append(root);
	});
	afterEach(() => {
		disposeStore?.();
		document.getElementById(windowRootId)?.remove();
		vi.useRealTimers();
	});
	it("reuses dictionary identity and fully replaces parameters with defaults", () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const first = store.openWindow({
			targetType: "DictQuery",
			title: "Entry",
			params: {
				textId: "dict",
				queryString: "a",
				queryParams: { id: "entry" },
				isQueryVisible: false,
			},
		});
		const second = store.openWindow({
			targetType: "DictQuery",
			title: "Search",
			params: { textId: "dict", queryString: "b" },
		});
		expect(second).toBe(first);
		expect(second?.params).toMatchObject({ isQueryVisible: true });
		expect(second?.params).not.toHaveProperty("queryParams");
		expect(second?.label).toBe("Search");
	});
	it("persists parameter replacement without a focus event and batches geometry events", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const window = store.openWindow(text())!;
		expect(isReactive(window.winbox)).toBe(false);
		await persist();
		mocks.navigate.mockClear();
		store.openWindow({ ...text("Changed"), params: { textId: "one", showCitation: true } });
		mocks.windows[0]!.x = 240;
		mocks.windows[0]!.options.onmove();
		mocks.windows[0]!.width = 600;
		mocks.windows[0]!.options.onresize();
		await persist();
		expect(mocks.navigate).toHaveBeenCalledTimes(1);
		const states = decodeWindowStates(mocks.navigate.mock.calls[0]![0].query.w!);
		expect(states[0]).toMatchObject({ title: "Changed", params: { showCitation: true } });
		expect(window.label).toBe("Changed");
	});
	it("preserves explicit duplicates during restoration and Unicode", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		store.openWindow(text("العربية"), { reuse: false });
		store.openWindow(text("ä"), { reuse: false });
		await persist();
		mocks.route.query = mocks.navigate.mock.calls.at(-1)![0].query;
		await store.restoreState();
		expect(store.registry.size).toBe(2);
		expect([...store.registry.values()].map((window) => window.label)).toEqual(["العربية", "ä"]);
	});
	it("reuses sample data type and supports explicit new windows", () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const state = {
			targetType: "ExploreSamples" as const,
			title: "Samples",
			params: { dataType: "SampleText" as const, word: "one" },
		};
		const first = store.openWindow(state);
		expect(store.openWindow({ ...state, params: { ...state.params, word: "two" } })).toBe(first);
		store.openWindow(state, { reuse: false });
		expect(store.registry.size).toBe(2);
	});
	it("cancels pending writes when leaving home", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		store.openWindow(text());
		mocks.route.path = "/imprint";
		await persist();
		expect(mocks.navigate).not.toHaveBeenCalled();
	});
	it("falls back to initial state for malformed URLs", async () => {
		mocks.route.query = { w: encodeWindowStates([]).slice(1), a: "none" };
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		await store.restoreState();
		await persist();
		expect(store.registry.size).toBe(1);
		expect(mocks.navigate).toHaveBeenCalledTimes(1);
	});
	it("ignores malformed entries and missing roots", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		expect(store.openWindow(null as unknown as WindowState)).toBeUndefined();
		expect(store.openWindow({ targetType: "Text" } as WindowState)).toBeUndefined();
		mocks.route.query = { w: encodeWindowStates([null, 3, text()]), a: "none" };
		await store.restoreState();
		expect(store.registry.size).toBe(1);
		document.getElementById(windowRootId)?.remove();
		expect(store.openWindow(text(), { reuse: false })).toBeUndefined();
	});
	it("selects the most recently focused duplicate", () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const first = store.openWindow(text(), { reuse: false })!;
		store.openWindow(text(), { reuse: false });
		mocks.windows[0]!.options.onfocus();
		expect(store.addWindow(text())).toBe(first);
	});
	it("suppresses unchanged URLs and excluded derived map layers", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const window = store.openWindow({
			targetType: "WMap",
			params: { endpoint: "data_markers", queryString: "" },
			title: "Map",
		})!;
		await persist();
		mocks.route.query = mocks.navigate.mock.calls.at(-1)![0].query;
		mocks.navigate.mockClear();
		if (window.targetType === "WMap") window.params.dataListLayers = [];
		await persist();
		expect(mocks.navigate).not.toHaveBeenCalled();
		mocks.windows[0]!.options.onmove();
		await persist();
		expect(mocks.navigate).not.toHaveBeenCalled();
	});
	it("recovers after failed navigation", async () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		mocks.navigate.mockRejectedValueOnce(new Error("Navigation failed"));
		store.openWindow(text());
		await persist();
		store.openWindow(text("Retry"));
		await persist();
		expect(mocks.navigate).toHaveBeenCalledTimes(2);
		log.mockRestore();
	});
	it("queues navigation and keeps the latest state", async () => {
		let resolve: (() => void) | undefined;
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		mocks.navigate.mockImplementationOnce(
			() =>
				new Promise<void>((done) => {
					resolve = done;
				}),
		);
		store.openWindow(text());
		await persist();
		store.openWindow(text("Second"));
		await persist();
		expect(mocks.navigate).toHaveBeenCalledTimes(1);
		store.openWindow(text("Latest"));
		await persist();
		resolve?.();
		await vi.advanceTimersByTimeAsync(0);
		expect(mocks.navigate).toHaveBeenCalledTimes(2);
		expect(decodeWindowStates(mocks.navigate.mock.calls[1]![0].query.w!)[0]).toMatchObject({
			title: "Latest",
		});
	});
	it("resolves configured text defaults before validation and keeps incoming overrides", () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const window = store.openWindow({
			targetType: "Text",
			title: "Configured",
			params: { textId: "configured" },
		})!;
		expect(window.params).toMatchObject({ showCitation: true });
		expect(mocks.windows[0]!.options.width).toBe(600);
		const reused = store.openWindow({
			targetType: "Text",
			title: "Override",
			params: { textId: "configured", showCitation: false },
		});
		expect(reused).toBe(window);
		expect(window.params).toMatchObject({ showCitation: false });
	});
	it("resets highlights and cancels their timers on close", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const window = store.openWindow(text())!;
		store.openWindow(text(), { highlight: true });
		expect(mocks.windows[0]!.classes.has("highlighted")).toBe(true);
		await vi.advanceTimersByTimeAsync(500);
		store.openWindow(text(), { highlight: true });
		await vi.advanceTimersByTimeAsync(600);
		expect(mocks.windows[0]!.classes.has("highlighted")).toBe(true);
		store.removeWindow(window.id);
		await vi.advanceTimersByTimeAsync(1000);
		expect(mocks.windows[0]!.classes.has("highlighted")).toBe(true);
		expect(store.registry.size).toBe(0);
	});
	it("persists citation, pagination, arrangement, and removal", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const window = store.openWindow({
			targetType: "ExploreSamples",
			title: "Samples",
			params: { dataType: "SampleText" },
		})!;
		await persist();
		mocks.navigate.mockClear();
		store.updateWindowParams(window.id, { dataType: "SampleText", showCitation: true, page: 2 });
		store.setWindowArrangement("none");
		await persist();
		expect(mocks.navigate).toHaveBeenCalledTimes(1);
		expect(mocks.navigate.mock.calls[0]![0].query.a).toBe("none");
		expect(decodeWindowStates(mocks.navigate.mock.calls[0]![0].query.w!)[0]).toMatchObject({
			params: { showCitation: true, page: 2 },
		});
		store.removeWindow(window.id);
		await persist();
		expect(decodeWindowStates(mocks.navigate.mock.calls.at(-1)![0].query.w!)).toEqual([]);
	});
	it("restores the legacy z geometry field", async () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		mocks.route.query = { w: encodeWindowStates([{ ...text(), z: 17 }]), a: "none" };
		await store.restoreState();
		expect(mocks.windows[0]!.options.index).toBe(17);
	});
	it("delegates the opening facade to the same store identity", () => {
		const store = useWindowsStore();
		disposeStore = () => {
			store.$dispose();
		};
		const first = store.addWindow(text());
		const open = useOpenOrUpdateWindow();
		const second = open(
			{
				targetType: "Text",
				params: { textId: "one", showCitation: true },
				id: "incoming",
				label: "Incoming",
			},
			"Updated",
			true,
		);
		expect(second).toBe(first);
		expect(store.registry.size).toBe(1);
		expect(second?.label).toBe("Updated");
	});
});
