import { nanoid } from "nanoid";
import WinBox from "winbox";
import { z } from "zod";

import type { QueryDescription } from "@/lib/api-client";
import * as arrange from "@/utils/window-arrangement";

import { useToastsStore } from "./use-toasts-store";

interface WindowItemBase {
	id: string;
	winbox: WinBox;
}

export interface BibliographyQueryWindowItem extends WindowItemBase {
	kind: "bibliography-query";
	params: unknown;
}

export interface CorpusQueryWindowItem extends WindowItemBase {
	kind: "corpus-query";
	params: unknown;
}

export interface CorpusTextWindowItem extends WindowItemBase {
	kind: "corpus-text";
	params: unknown;
}

export interface CrossDictionaryQueryWindowItem extends WindowItemBase {
	kind: "cross-dictionary-query";
	params: unknown;
}

export interface DataListWindowItem extends WindowItemBase {
	kind: "data-list";
	params: unknown;
}

export interface DictionaryEntryWindowItem extends WindowItemBase {
	kind: "dictionary-entry";
	params: unknown;
}

export interface DictionaryQueryWindowItem extends WindowItemBase {
	kind: "dictionary-query";
	params: unknown;
}

export interface GeoMapWindowItem extends WindowItemBase {
	kind: "geo-map";
	params: QueryDescription & { id: string };
}

export interface SampleTextWindowItem extends WindowItemBase {
	kind: "sample-text";
	params: unknown;
}

export interface TextWindowItem extends WindowItemBase {
	kind: "text";
	params: {
		id: string;
	};
}

export interface ProfileWindowItem extends WindowItemBase {
	kind: "profile";
	params: {
		id: string;
	};
}

export type WindowItem =
	| BibliographyQueryWindowItem
	| CorpusQueryWindowItem
	| CorpusTextWindowItem
	| CrossDictionaryQueryWindowItem
	| DataListWindowItem
	| DictionaryEntryWindowItem
	| DictionaryQueryWindowItem
	| GeoMapWindowItem
	| ProfileWindowItem
	| SampleTextWindowItem
	| TextWindowItem;

export type WindowItemKind = WindowItem["kind"];

export type WindowItemMap = {
	[Kind in WindowItemKind]: Extract<WindowItem, { kind: Kind }>;
};

export type WindowRegistry = Map<WindowItem["id"], WindowItem>;

export const arrangements = {
	none: { id: "none", label: "None" },
	cascade: { id: "cascade", label: "Cascade" },
	tile: { id: "tile", label: "Tile" },
	"smart-tile": { id: "smart-tile", label: "Smart tile" },
};

export type WindowArrangement = keyof typeof arrangements;

const WindowState = z.object({
	x: z.number(),
	y: z.number(),
	z: z.number(),
	width: z.number(),
	height: z.number(),
	kind: z.string(),
	title: z.string(),
	params: z.unknown(),
});
type WindowStateInferred = z.infer<typeof WindowState>;

export const useWindowsStore = defineStore("windows", () => {
	const registry = ref<WindowRegistry>(new Map());
	const arrangement = ref<WindowArrangement>("smart-tile");

	const router = useRouter();
	const route = useRoute();

	const toasts = useToastsStore();

	async function initializeScreen() {
		await navigateTo({
			path: "/",
			query: { w: btoa("[]"), a: arrangement.value },
		});
	}

	const restoreState = async () => {
		if (!route.query.w || !route.query.a) {
			await initializeScreen();
			return;
		}
		const w = atob(route.query.w);

		let windowStates: Array<WindowStateInferred>;
		try {
			windowStates = JSON.parse(w) as Array<WindowStateInferred>;
		} catch (e) {
			toasts.addToast({
				title: "RestoreState Error: JSON parse failed",
				description: e instanceof Error ? e.message : "Unknown error, check console",
			});
			console.error(e);
			await initializeScreen();
			return;
		}

		if (!Array.isArray(windowStates)) {
			toasts.addToast({
				title: "RestoreState Error: Window list is not array",
				description: "Window list parameter must be an array",
			});
			await initializeScreen();
			return;
		}

		await nextTick();
		windowStates.forEach((w) => {
			try {
				WindowState.parse(w);
				addWindow({
					title: w.title,
					kind: w.kind as WindowItemKind,
					params: w.params,
					x: String(w.x) + "%",
					y: String(w.y) + "%",
					zIndex: w.z,
					height: String(w.height) + "%",
					width: String(w.width) + "%",
				});
			} catch (e) {
				toasts.addToast({
					title: "RestoreState Error: WindowState parse failed",
					description: e instanceof Error ? e.message : "Unknown error, check console",
				});
				console.error(e);
			}
		});
		setWindowArrangement(route.query.a as WindowArrangement);
	};

	function addWindow<Kind extends WindowItemKind>(params: {
		id?: string | null;
		title: string;
		kind: Kind;
		params: WindowItemMap[Kind]["params"];
		x?: number | string; // string support added for "px" and "%" typed values
		y?: number | string;
		width?: number | string;
		height?: number | string;
		zIndex?: number;
	}) {
		const rootElement = document.getElementById(windowRootId);
		if (rootElement == null) return;

		/** Ensure windows open only on `/`. */
		if (route.path !== "/") {
			void router.push("/");
		}

		const id = params.id ?? `window-${nanoid()}`;
		const { title, kind } = params;

		if (registry.value.has(id)) {
			registry.value.get(id)?.winbox.focus();
			return;
		}

		const winbox = new WinBox({
			id,
			title,
			index: params.zIndex ? params.zIndex : undefined,
			x: params.x ? params.x : "center",
			y: params.y ? params.y : "center",
			width: params.width,
			height: params.height,
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

		registry.value.set(id, {
			id,
			winbox,
			kind,
			params: params.params,
		} as WindowItem);
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
		}
	}

	watch([() => registry.value.size, arrangement], () => {
		arrangeWindows();
		updateUrl();
	});

	function serializeWindowStates() {
		const windowStates: Array<WindowStateInferred> = [];

		const rootElement = document.getElementById(windowRootId);
		if (rootElement == null) return;
		const viewport = rootElement.getBoundingClientRect();

		function viewportPercentageWith2DigitPrecision(x: number, dir: "height" | "width") {
			return Math.floor((10000 * x) / viewport[dir]) / 100;
		}

		registry.value.forEach((w) => {
			windowStates.push({
				x: viewportPercentageWith2DigitPrecision(w.winbox.x as number, "width"),
				y: viewportPercentageWith2DigitPrecision(w.winbox.y as number, "height"),
				z: w.winbox.index,
				width: viewportPercentageWith2DigitPrecision(w.winbox.width as number, "width"),
				height: viewportPercentageWith2DigitPrecision(w.winbox.height as number, "height"),
				kind: w.kind,
				title: w.winbox.title,
				params: w.params,
			} as WindowStateInferred);
		});
		console.log(JSON.stringify(windowStates));
		return windowStates;
	}

	function updateUrl() {
		const windowStates = serializeWindowStates();
		// TODO: check url length, it may be too long. Note: shortest limit is 2047 (MS Edge) https://serpstat.com/blog/how-long-should-be-the-page-url-length-for-seo/
		void navigateTo({
			path: "/",
			query: {
				w: btoa(JSON.stringify(windowStates)),
				a: arrangement.value,
			},
		});
	}

	return {
		restoreState,
		addWindow,
		removeWindow,
		registry,
		arrangement,
		setWindowArrangement,
		arrangeWindows,
	};
});
