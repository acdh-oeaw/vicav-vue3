import { nanoid } from "nanoid";
import WinBox from "winbox";
import { z } from "zod";

import {
	type OpenWindowItem,
	QueryString,
	Schema,
	TeiSource,
	type WindowItem,
	type WindowItemMap,
	type WindowItemTargetType,
} from "@/types/global.ts";
import * as arrange from "@/utils/window-arrangement";
import {
	enableWindowBodyKeyboardScrollFocus,
	focusWindowBodyKeyboardScrollTarget,
} from "@/utils/window-body-focus.ts";
import { getWindowIdentity } from "@/utils/window-identity";
import { decodeWindowStates, encodeWindowStates } from "@/utils/window-state-codec";

import { useToastsStore } from "./use-toasts-store.ts";

export const narrowScreenBreakpoint = 1024;
const listMapDefaultTitle = "Variety data";

export type WindowRegistry = Map<WindowItem["id"], OpenWindowItem>;

export const arrangements = {
	none: { id: "none", label: "None" },
	cascade: { id: "cascade", label: "Cascade" },
	tile: { id: "tile", label: "Tile" },
	"smart-tile": { id: "smart-tile", label: "Smart tile" },
	"column-five-flex": { id: "column-five-flex", label: "Column 5 Flex" },
};

export type WindowArrangement = keyof typeof arrangements;

const WindowState = z.intersection(
	Schema,
	z.object({
		x: z.number().or(z.string()).optional(),
		y: z.number().or(z.string()).optional(),
		zIndex: z.number().optional(),
		width: z.number().or(z.string()).optional(),
		height: z.number().or(z.string()).optional(),
		title: z.string(),
	}),
);
export type WindowState = z.input<typeof WindowState>;

interface WindowControlConfig<TTargetType extends WindowItemTargetType> {
	targetTypes: ReadonlyArray<TTargetType>;
	className: string;
	title: string;
	click: (windowItem: WindowItemMap[TTargetType]) => void;
}

//helper to preserve Param shape inference according to target type
function defineWindowControl<TTargetType extends WindowItemTargetType>(
	config: WindowControlConfig<TTargetType>,
) {
	return config;
}

export const useWindowsStore = defineStore("windows", () => {
	const registry = ref<WindowRegistry>(new Map());
	const arrangement = ref<WindowArrangement>("smart-tile");

	const router = useRouter();
	const route = useRoute();

	const toasts = useToastsStore();

	const { data, suspense } = useProjectInfo();
	const initialScreenSetup = computed(() => {
		return data.value?.projectConfig?.panel ?? [];
	});
	const highlightTimers = new Map<string, ReturnType<typeof setTimeout>>();
	const focusOrder = new Map<string, number>();
	let focusSequence = 0;
	const geometryRevision = ref(0);
	let restoring = false;
	let persistenceTimer: ReturnType<typeof setTimeout> | undefined;
	let navigation = Promise.resolve();
	let persistenceGeneration = 0;

	const geojsonStore = useGeojsonStore();

	watch(
		[() => [...registry.value.keys()], arrangement],
		() => {
			arrangeWindows();
		},
		{ flush: "post" },
	);

	const windowControlConfigs = [
		defineWindowControl({
			targetTypes: [
				"ExploreSamples",
				"Profile",
				"Feature",
				"CorpusText",
				"SampleText",
				"Text",
				"FeatureValue",
				"Location",
			],
			className: "wb-cite",
			title: "Show citation",
			click(windowItem) {
				updateWindowParams(windowItem.id, {
					...windowItem.params,
					showCitation: !windowItem.params.showCitation,
				});
			},
		}),
		defineWindowControl({
			targetTypes: ["ListMap"],
			className: "wb-map",
			title: "Open map",
			click() {
				openWindow(
					{
						targetType: "GeojsonMap",
						params: {
							markerType: "petal",
						},
						title: "Variety Data - Map View",
					},
					{ highlight: true },
				);
			},
		}),
		defineWindowControl({
			targetTypes: ["DataList"],
			className: "wb-map",
			title: "Show or remove from map",
			click(windowItem) {
				updateWindowParams(windowItem.id, {
					...windowItem.params,
					mapEnabled: !windowItem.params.mapEnabled,
					mapSyncId: windowItem.params.mapSyncId ?? windowItem.id,
				});
			},
		}),
		defineWindowControl({
			targetTypes: ["GeojsonMap"],
			className: "wb-table",
			title: "Open table",
			click() {
				const table = geojsonStore.table;
				const globalFilter = (table?.getState().globalFilter as string | undefined) ?? "";
				openWindow(
					{
						targetType: "ListMap",
						params: {
							queryString: globalFilter,
						},
						title: globalFilter || listMapDefaultTitle,
					},
					{ highlight: true },
				);
			},
		}),
		defineWindowControl({
			targetTypes: ["ListMap"],
			className: "wb-map",
			title: "Open table",
			click() {
				openWindow(
					{
						targetType: "GeojsonMap",
						params: {
							markerType: "petal",
						},
						title: "Variety Data - Map View",
					},
					{ highlight: true },
				);
			},
		}),
	];

	async function restoreState() {
		cancelPersistence();
		restoring = true;
		try {
			let states: ReadonlyArray<unknown>;
			let restoredArrangement: WindowArrangement = "smart-tile";
			try {
				if (!route.query.w) throw new Error("Missing window state");
				states = decodeWindowStates(String(route.query.w));
				if (typeof route.query.a === "string" && route.query.a in arrangements)
					restoredArrangement = route.query.a as WindowArrangement;
			} catch (error) {
				if (route.query.w)
					toasts.addToast({
						title: "RestoreState Error",
						description: error instanceof Error ? error.message : "Invalid window state",
						type: "foreground",
						variant: "negative",
					});
				await suspense();
				states = initialScreenSetup.value;
			}
			await nextTick();
			for (const window of [...registry.value.values()]) window.winbox.close();
			for (const state of states) openWindowState(state, { reuse: false });
			setWindowArrangement(restoredArrangement);
			await nextTick();
		} finally {
			restoring = false;
			schedulePersistence();
		}
	}

	function highlightWindow(window: OpenWindowItem) {
		clearTimeout(highlightTimers.get(window.id));
		window.winbox.addClass("highlighted");
		highlightTimers.set(
			window.id,
			setTimeout(() => {
				window.winbox.removeClass("highlighted");
				highlightTimers.delete(window.id);
			}, 1000),
		);
	}

	function openWindow(state: WindowState, options: { reuse?: boolean; highlight?: boolean } = {}) {
		return openWindowState(state, options);
	}

	function openWindowState(input: unknown, { reuse = true, highlight = false } = {}) {
		const candidate = z
			.object({ targetType: z.string(), params: z.record(z.string(), z.unknown()) })
			.loose()
			.safeParse(input);
		const stateParams = candidate.success ? candidate.data : undefined;
		const textId = stateParams?.params.textId;
		const defaults =
			textId == null
				? undefined
				: data.value?.projectConfig?.menu?.main
						?.flatMap((entry) => entry.item)
						.find(
							(entry) =>
								entry.targetType === stateParams?.targetType &&
								(entry.id === textId ||
									(entry.params != null &&
										"textId" in entry.params &&
										entry.params.textId === textId)),
						);
		const result = WindowState.safeParse(
			stateParams
				? {
						...defaults,
						...stateParams,
						zIndex: stateParams.zIndex ?? stateParams.z,
						params: { ...defaults?.params, ...stateParams.params },
					}
				: input,
		);
		if (!result.success) {
			toasts.addToast({
				title: "AddWindow Error: parameter parse failed",
				description: "Check the console for details.",
				type: "foreground",
				variant: "negative",
			});
			console.error(result.error);
			return;
		}
		if (route.path !== "/") void router.push("/");
		const state = result.data;
		const identity = getWindowIdentity(state);
		const existing =
			reuse && identity != null
				? [...registry.value.values()]
						.filter((window) => getWindowIdentity(window) === identity)
						.sort((a, b) => (focusOrder.get(b.id) ?? 0) - (focusOrder.get(a.id) ?? 0))[0]
				: undefined;
		if (existing) {
			updateWindow(existing.id, state.params, state.title);
			existing.winbox.focus();
			focusOrder.set(existing.id, ++focusSequence);
			if (highlight) highlightWindow(existing);
			return existing;
		}
		return createWindow(state);
	}

	function addWindow(state: WindowState) {
		return openWindow(state);
	}

	function createWindow(windowState: WindowState) {
		const rootElement = document.getElementById(windowRootId);
		if (rootElement == null) return;
		const id = `window-${nanoid()}`;
		const { title, targetType, params } = windowState;
		const winbox = markRaw(
			new WinBox({
				id,
				title,
				index: windowState.zIndex ?? undefined,
				x: windowState.x ?? "center",
				y: windowState.y ?? "center",
				width: windowState.width,
				height: windowState.height,
				onfocus() {
					focusOrder.set(id, ++focusSequence);
					geometryRevision.value++;
				},
				onresize() {
					geometryRevision.value++;
				},
				onmove() {
					geometryRevision.value++;
				},
				onclose() {
					clearTimeout(highlightTimers.get(id));
					highlightTimers.delete(id);
					focusOrder.delete(id);
					registry.value.delete(id);
					return false;
				},
				root: rootElement,
			}),
		);
		// window ids are random, so the kind of content is the only stable way to address a window
		// from the outside (the guided tour attaches its steps to elements inside specific windows)
		(winbox.dom as HTMLElement).dataset.windowType = targetType;
		//focus window content on every click
		enableWindowBodyKeyboardScrollFocus(winbox.body);
		//focus window when opened the first time (=now)
		void focusWindowBodyKeyboardScrollTarget(winbox.body, null, { afterRender: true });

		const teiSourceParse = TeiSource.safeParse(params);
		if (teiSourceParse.success) {
			winbox.addControl({
				index: 0,
				class: "wb-tei",
				click: function () {
					if (teiSourceParse.data.teiSource) {
						window.open(teiSourceParse.data.teiSource, "_blank");
					}
				},
			});
		}

		registry.value.set(id, {
			id,
			label: title,
			winbox,
			targetType,
			params,
		} as OpenWindowItem);

		const w = registry.value.get(id);
		if (w == null) return;

		focusOrder.set(id, ++focusSequence);
		addConfiguredWindowControls(w);
		return w;
	}

	function addConfiguredWindowControls(windowItem: OpenWindowItem) {
		windowControlConfigs.forEach((config) => {
			const targetTypes: ReadonlyArray<WindowItemTargetType> = config.targetTypes;
			if (!targetTypes.includes(windowItem.targetType)) return;

			windowItem.winbox.addControl({
				index: 0,
				class: config.className,
				click: function () {
					config.click(windowItem as never);
				},
			});

			const winboxElement = windowItem.winbox.dom as HTMLElement;
			const controls = winboxElement.querySelectorAll(`.${config.className}`);
			if (controls.length > 0) {
				const el = controls[0] as HTMLSpanElement;
				el.title = config.title;
			}
		});
		updateDataListMapControlState(windowItem);
	}

	function updateDataListMapControlState(windowItem: OpenWindowItem) {
		if (windowItem.targetType !== "DataList") return;

		const control = (windowItem.winbox.dom as HTMLElement).querySelector<HTMLSpanElement>(
			".wb-map",
		);
		if (control == null) return;

		const isMapEnabled = windowItem.params.mapEnabled === true;
		control.classList.toggle("wb-map-active", isMapEnabled);
		control.setAttribute("aria-pressed", String(isMapEnabled));
		control.title = isMapEnabled ? "Remove from map" : "Show on map";
	}

	function removeWindow(id: WindowItem["id"]) {
		registry.value.get(id)?.winbox.close();
	}

	function setWindowArrangement(id: WindowArrangement) {
		arrangement.value = id;
	}

	function arrangeWindows() {
		if (registry.value.size === 0) return;

		const rootElement = document.getElementById(windowRootId);
		if (rootElement == null) return;

		const viewport = rootElement.getBoundingClientRect();
		const windows = Array.from(registry.value.values());

		if (viewport.width < narrowScreenBreakpoint) {
			arrange.maximize(viewport, windows);
			return;
		}

		switch (arrangement.value) {
			case "cascade": {
				arrange.cascade(viewport, windows);
				break;
			}

			case "none": {
				arrange.none(viewport, windows);
				break;
			}

			case "smart-tile": {
				arrange.smartTile(viewport, windows);
				break;
			}

			case "tile": {
				arrange.tile(viewport, windows);
				break;
			}

			case "column-five-flex": {
				arrange.columnFiveFlex(viewport, windows);
				break;
			}
		}
		arrange.splitDataListsAndMap(viewport, windows);
	}

	function getPersistedWindowParams(windowItem: WindowItem): WindowItem["params"] {
		if (windowItem.targetType !== "WMap" || windowItem.params.endpoint !== "data_markers")
			return windowItem.params;

		const { dataListLayers: _, ...params } = windowItem.params;
		return params;
	}

	function serializeWindowStates() {
		const windowStates: Array<WindowState> = [];

		const rootElement = document.getElementById(windowRootId);
		if (rootElement == null) return;
		const viewport = rootElement.getBoundingClientRect();

		function viewportPercentageWith2DigitPrecision(x: number, dir: "height" | "width") {
			return `${String(Math.floor((10000 * x) / viewport[dir]) / 100)}%`;
		}

		registry.value.forEach((w) => {
			windowStates.push({
				x: viewportPercentageWith2DigitPrecision(w.winbox.x as number, "width"),
				y: viewportPercentageWith2DigitPrecision(w.winbox.y as number, "height"),
				z: w.winbox.index,
				width: viewportPercentageWith2DigitPrecision(w.winbox.width as number, "width"),
				height: viewportPercentageWith2DigitPrecision(w.winbox.height as number, "height"),
				targetType: w.targetType,
				title: w.label,
				params: getPersistedWindowParams(w),
			} as WindowState);
		});
		return windowStates;
	}

	function cancelPersistence() {
		clearTimeout(persistenceTimer);
		persistenceGeneration++;
	}

	function schedulePersistence() {
		cancelPersistence();
		if (restoring || route.path !== "/") return;
		const generation = persistenceGeneration;
		persistenceTimer = setTimeout(() => {
			navigation = navigation
				.then(async () => {
					await nextTick();
					if (restoring || generation !== persistenceGeneration || route.path !== "/") return;
					const states = serializeWindowStates();
					if (states == null) return;
					const w = encodeWindowStates(states);
					const a = arrangement.value;
					if (route.query.w === w && route.query.a === a) return;
					await navigateTo({ path: "/", query: { w, a } });
				})
				.catch((error: unknown) => {
					console.error(error);
				});
		}, 150);
	}

	watch(
		() => {
			const revision = geometryRevision.value;
			return JSON.stringify({
				revision,
				arrangement: arrangement.value,
				states: serializeWindowStates(),
			});
		},
		schedulePersistence,
		{ flush: "post" },
	);
	watch(() => route.path, schedulePersistence);
	onScopeDispose(() => {
		cancelPersistence();
		for (const timer of highlightTimers.values()) clearTimeout(timer);
	});

	function updateQueryParam(id: WindowItem["id"], query: string) {
		const window = registry.value.get(id);
		if (window && QueryString.safeParse(window.params).success)
			updateWindow(
				id,
				{ ...window.params, queryString: query },
				window.targetType === "ListMap" ? query || listMapDefaultTitle : query,
			);
	}

	function updateWindowParams(id: WindowItem["id"], params: WindowItem["params"]) {
		updateWindow(id, params);
	}

	function updateWindow(id: WindowItem["id"], params: WindowItem["params"], title?: string) {
		const w = registry.value.get(id);

		if (w == null) return;

		const parsedWindow = Schema.safeParse({ targetType: w.targetType, params });

		if (!parsedWindow.success) {
			toasts.addToast({
				title: "UpdateWindowParams Error: parameter parse failed",
				description: "Check the console for details.",
				type: "foreground",
				variant: "negative",
			});
			console.error(parsedWindow.error);
			return;
		}

		w.params = parsedWindow.data.params;
		if (title != null) {
			w.label = title;
			w.winbox.setTitle(title);
		}
		updateDataListMapControlState(w);
		geometryRevision.value++;
	}

	return {
		restoreState,
		addWindow,
		openWindow,
		updateWindow,
		removeWindow,
		updateQueryParam,
		updateWindowParams,
		registry,
		arrangement,
		setWindowArrangement,
		arrangeWindows,
	};
});
