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

export type WindowItem =
	| BibliographyQueryWindowItem
	| CorpusQueryWindowItem
	| CorpusTextWindowItem
	| CrossDictionaryQueryWindowItem
	| DataListWindowItem
	| DictionaryEntryWindowItem
	| DictionaryQueryWindowItem
	| GeoMapWindowItem
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
			query: { w: "[]", a: arrangement.value },
		});
	}

	const restoreState = async () => {
		if (!route.query.w || !route.query.a) {
			await initializeScreen();
			return;
		}

		let windowStates: Array<WindowStateInferred>;
		try {
			windowStates = JSON.parse(route.query.w as string) as Array<WindowStateInferred>;
		} catch (e) {
			toasts.addToast({ title: "Error: JSON parse failed", description: e.message });
			await initializeScreen();
			return;
		}

		if (!Array.isArray(windowStates)) {
			toasts.addToast({
				title: "Error: Window list is not array",
				description: "Window list parameter must be an array",
			});
			await initializeScreen();
			return;
		}

		await nextTick();
		//TODO recalculate x/y/width/height according to current screen size
		windowStates.forEach((w) => {
			try {
				WindowState.parse(w);
				addWindow({
					title: w.title,
					kind: w.kind,
					params: w.params,
					x: w.x,
					y: w.y,
					height: w.height,
					width: w.width,
				});
			} catch (e) {
				toasts.addToast({ title: "Error: WindowState parse failed", description: e.message });
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
		x?: number;
		y?: number;
		width?: number;
		height?: number;
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
			x: params.x ? params.x : "center",
			y: params.y ? params.y : "center",
			width: params.width,
			height: params.height,
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
		registry.value.forEach((w) => {
			windowStates.push({
				x: w.winbox.x as number,
				y: w.winbox.y as number,
				width: w.winbox.width as number,
				height: w.winbox.height as number,
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
				w: JSON.stringify(windowStates),
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
