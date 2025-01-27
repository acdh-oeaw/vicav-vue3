import { nanoid } from "nanoid";
import WinBox from "winbox";
import { z } from "zod";

import type { QueryParamsType } from "@/lib/api-client";
import {
	QueryString,
	Schema,
	TeiSource,
	TextId,
	type WindowItem,
	type WindowItemTargetType,
} from "@/types/global.d";
import * as arrange from "@/utils/window-arrangement";

import { useToastsStore } from "./use-toasts-store";

const narrowScreenBreakpoint = 1024;

export type WindowRegistry = Map<WindowItem["id"], WindowItem>;

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
export type WindowState = z.infer<typeof WindowState>;

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

	async function initializeScreen() {
		await suspense();
		await navigateTo({
			path: "/",
			query: { w: btoa(JSON.stringify(initialScreenSetup.value)), a: arrangement.value },
		});
		await restoreState();
	}

	const restoreState = async () => {
		if (!route.query.w || !route.query.a) {
			await initializeScreen();
			return;
		}

		let windowStates: Array<WindowState>;
		try {
			const w = atob(route.query.w as string);
			windowStates = JSON.parse(w) as Array<WindowState>;
		} catch (e) {
			toasts.addToast({
				title: "RestoreState Error: JSON parse failed",
				description: e instanceof Error ? e.message : "Unknown error, check console",
				type: "foreground",
				variant: "negative",
			});
			console.error(e);
			await initializeScreen();
			return;
		}

		if (!Array.isArray(windowStates)) {
			toasts.addToast({
				title: "RestoreState Error: Window list is not array",
				description: "Window list parameter must be an array",
				type: "foreground",
				variant: "negative",
			});
			await initializeScreen();
			return;
		}

		await nextTick();
		windowStates.forEach((w) => {
			addWindow(w);
		});
		setWindowArrangement(route.query.a as WindowArrangement);
	};

	function addWindow(stateParams: WindowState) {
		const rootElement = document.getElementById(windowRootId);
		if (rootElement == null) return;

		/** Ensure windows open only on `/`. */
		if (route.path !== "/") {
			void router.push("/");
		}

		let windowState: WindowState;
		try {
			windowState = WindowState.parse(stateParams);
		} catch (e) {
			toasts.addToast({
				title: "AddWindow Error: parameter parse failed",
				description: "Check the console for details.",
				type: "foreground",
				variant: "negative",
			});
			console.error(e);
			return;
		}

		const id = `window-${nanoid()}`;
		const { title, targetType, params } = windowState;

		const ci = TextId.safeParse(params);
		if (ci.success) {
			const w = findWindowByTypeAndParam(targetType, "textId", String(ci.data.textId));
			if (w !== null) {
				w.winbox.focus();
				w.winbox.addClass("highlighted");
				setTimeout(() => {
					w.winbox.removeClass("highlighted");
				}, 1000);
				return;
			}
		}

		const winbox = new WinBox({
			id,
			title,
			index: windowState.zIndex ? windowState.zIndex : undefined,
			x: windowState.x ? windowState.x : "center",
			y: windowState.y ? windowState.y : "center",
			width: windowState.width,
			height: windowState.height,
			onfocus() {
				updateUrl();
			},
			onresize() {
				updateUrl();
			},
			onmove() {
				updateUrl();
			},
			onclose() {
				registry.value.delete(id);
				return false;
			},
			root: rootElement,
		});

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
			winbox,
			targetType,
			params,
		} as WindowItem);

		const w = registry.value.get(id);

		if (
			["ExploreSamples", "Profile", "Feature", "CorpusText", "SampleText", "Text"].includes(
				w!.targetType,
			)
		) {
			w!.winbox.addControl({
				index: 0,
				class: "wb-cite",
				click: function () {
					//@ts-expect-error TODO distill a proper type for paramName
					w!.params.showCitation = !w.params.showCitation;
				},
			});
			const winboxElement = w!.winbox.dom as HTMLElement;
			const cite = winboxElement.querySelectorAll(".wb-cite");
			if (cite.length > 0) {
				const el = cite[0] as HTMLSpanElement;
				el.title = "Show citation";
			}
		}
		return w;
	}

	function findWindowByTypeAndParam(
		targetType: WindowItemTargetType,
		paramName: string,
		value: string,
	): WindowItem | null {
		let foundWindow: WindowItem | null = null;
		const dot = paramName.indexOf(".");
		let paramName1: string | undefined, paramName2: string | undefined;

		if (dot !== -1) {
			paramName1 = paramName.substring(0, dot);
			paramName2 = paramName.substring(dot + 1);
		}

		registry.value.forEach((w) => {
			const ci = Schema.safeParse(w);
			let windowValue;

			if (!ci.success || foundWindow !== null || w.targetType !== targetType) return;

			if (!paramName1) {
				//@ts-expect-error TODO distill a proper type for paramName
				windowValue = (ci.data.params as typeof Schema)[paramName] as string;
			} else if (paramName1 === "queryParams" && paramName2) {
				const params = ci.data.params as { queryParams?: QueryParamsType };
				windowValue = params.queryParams ? (params.queryParams[paramName2] as string) : undefined;
			} else {
				return;
			}
			if (windowValue === value) {
				foundWindow = w;
			}
		});
		return foundWindow;
	}

	function findWindowByTypeAndTitle(
		targetType: WindowItemTargetType,
		title: string,
	): WindowItem | null {
		let foundWindow: WindowItem | null = null;
		registry.value.forEach((w) => {
			const ci = Schema.safeParse(w);
			if (!ci.success || foundWindow !== null || w.targetType !== targetType) return;

			if (w.winbox.title === title) {
				foundWindow = w;
			}
		});
		return foundWindow;
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
	}

	watch([() => registry.value.size, arrangement], () => {
		arrangeWindows();
		updateUrl();
	});

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
				// @ts-expect-error Property missing in upstream types.
				x: viewportPercentageWith2DigitPrecision(w.winbox.x as number, "width"),
				// @ts-expect-error Property missing in upstream types.
				y: viewportPercentageWith2DigitPrecision(w.winbox.y as number, "height"),
				z: w.winbox.index,
				// @ts-expect-error Property missing in upstream types.
				width: viewportPercentageWith2DigitPrecision(w.winbox.width as number, "width"),
				// @ts-expect-error Property missing in upstream types.
				height: viewportPercentageWith2DigitPrecision(w.winbox.height as number, "height"),
				targetType: w.targetType,
				title: w.winbox.title,
				params: w.params,
			} as WindowState);
		});
		return windowStates;
	}

	function escapeUnicode(s: string) {
		return [...s]
			.map((c) =>
				/^[\x20-\x7f]$/.test(c)
					? c
					: c
							.split("")
							.map((a) => `\\u${a.charCodeAt(0).toString(16).padStart(4, "0")}`)
							.join(""),
			)
			.join("");
	}

	function updateUrl() {
		if (route.path === "/imprint") return;
		const windowStates = serializeWindowStates();
		// TODO: check url length, it may be too long. Note: shortest limit is 2047 (MS Edge) https://serpstat.com/blog/how-long-should-be-the-page-url-length-for-seo/
		void navigateTo({
			path: "/",
			query: {
				w: btoa(escapeUnicode(JSON.stringify(windowStates))),
				a: arrangement.value,
			},
		});
	}

	function updateQueryParam(id: WindowItem["id"], query: string) {
		const w = registry.value.get(id);
		if (w) {
			const wi = QueryString.safeParse(w.params);
			if (wi.success) {
				wi.data.queryString = query;
				w.winbox.setTitle(query);
				updateUrl();
			}
		}
	}

	return {
		restoreState,
		addWindow,
		removeWindow,
		updateQueryParam,
		registry,
		arrangement,
		setWindowArrangement,
		arrangeWindows,
		findWindowByTypeAndParam,
		findWindowByTypeAndTitle,
	};
});
