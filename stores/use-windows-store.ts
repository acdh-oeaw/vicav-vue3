import { nanoid } from "nanoid";
import WinBox from "winbox";
import { z } from "zod";

import * as arrange from "@/utils/window-arrangement";

import { useToastsStore } from "./use-toasts-store";

const narrowScreenBreakpoint = 1024;

interface WindowItemBase {
	id: string;
	winbox: WinBox;
}

export const BibliographyEntriesSchema = z.object({
	kind: z.literal("bibliography-entries"),
	params: z.object({
		query: z.string(),
		xslt: z.string().optional(),
	}),
});
export type BibliographyEntriesWindowItem = WindowItemBase &
	z.infer<typeof BibliographyEntriesSchema>;

export const CorpusQuerySchema = z.object({
	kind: z.literal("corpus-query"),
	params: z.unknown(),
});
export type CorpusQueryWindowItem = WindowItemBase & z.infer<typeof CorpusQuerySchema>;

export const CorpusTextSchema = z.object({
	kind: z.literal("corpus-text"),
	params: z.unknown(),
});
export type CorpusTextWindowItem = WindowItemBase & z.infer<typeof CorpusTextSchema>;

export const CrossDictionaryQuerySchema = z.object({
	kind: z.literal("cross-dictionary-query"),
	params: z.unknown(),
});
export type CrossDictionaryQueryWindowItem = WindowItemBase &
	z.infer<typeof CrossDictionaryQuerySchema>;

export const DataListSchema = z.object({
	kind: z.literal("data-list"),
	params: z.unknown(),
});
export type DataListWindowItem = WindowItemBase & z.infer<typeof DataListSchema>;

export const DictionaryEntrySchema = z.object({
	kind: z.literal("dictionary-entry"),
	params: z.unknown(),
});
export type DictionaryEntryWindowItem = WindowItemBase & z.infer<typeof DictionaryEntrySchema>;

export const DictionaryQuerySchema = z.object({
	kind: z.literal("dictionary-query"),
	params: z.unknown(),
});
export type DictionaryQueryWindowItem = WindowItemBase & z.infer<typeof DictionaryQuerySchema>;

export const GeoMapSchema = z.object({
	kind: z.literal("geo-map"),
	params: z.object({
		endpoint: z.string(),
		query: z.string().optional(),
		scope: z.enum(["reg", "geo", "diaGroup"]).optional(),
	}),
});
export type GeoMapWindowItem = WindowItemBase & z.infer<typeof GeoMapSchema>;

export const SampleTextSchema = z.object({
	kind: z.literal("sample-text"),
	params: z.unknown(),
});
export type SampleTextWindowItem = WindowItemBase & z.infer<typeof SampleTextSchema>;

export const TextSchema = z.object({
	kind: z.literal("text"),
	params: z.object({
		id: z.string(),
	}),
});
export type TextWindowItem = WindowItemBase & z.infer<typeof TextSchema>;

export const ProfileSchema = z.object({
	kind: z.literal("profile"),
	params: z.object({
		id: z.string(),
	}),
});
export type ProfileWindowItem = WindowItemBase & z.infer<typeof ProfileSchema>;

export const FeatureSchema = z.object({
	kind: z.literal("feature"),
	params: z.object({
		id: z.string(),
	}),
});
export type FeatureWindowItem = WindowItemBase & z.infer<typeof FeatureSchema>;

export const Schema = z.union([
	BibliographyEntriesSchema,
	CorpusQuerySchema,
	CorpusTextSchema,
	CrossDictionaryQuerySchema,
	DataListSchema,
	DictionaryEntrySchema,
	DictionaryQuerySchema,
	FeatureSchema,
	GeoMapSchema,
	ProfileSchema,
	SampleTextSchema,
]);
export type WindowItem = WindowItemBase & z.infer<typeof Schema>;

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

		let windowStates: Array<WindowStateInferred>;
		try {
			const w = atob(route.query.w as string);
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

		const w = windowWithContentId(params.kind, params.params);
		if (w != null) {
			w.winbox.focus();
			w.winbox.addClass("highlighted");
			setTimeout(() => {
				w.winbox.removeClass("highlighted");
			}, 1000);
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

	function windowWithContentId(
		kind: WindowItemKind,
		params: WindowItemMap[WindowItemKind]["params"],
	): WindowItem | null {
		let foundWindow: WindowItem | null = null;
		if (typeof params === "object" && params !== null && "id" in params) {
			registry.value.forEach((w) => {
				if (
					foundWindow === null &&
					w.kind === kind &&
					typeof w.params === "object" &&
					w.params !== null &&
					"id" in w.params &&
					w.params.id === params.id
				) {
					foundWindow = w;
				}
			});
		}
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
				// @ts-expect-error Property missing in upstream types.
				x: viewportPercentageWith2DigitPrecision(w.winbox.x as number, "width"),
				// @ts-expect-error Property missing in upstream types.
				y: viewportPercentageWith2DigitPrecision(w.winbox.y as number, "height"),
				z: w.winbox.index,
				// @ts-expect-error Property missing in upstream types.
				width: viewportPercentageWith2DigitPrecision(w.winbox.width as number, "width"),
				// @ts-expect-error Property missing in upstream types.
				height: viewportPercentageWith2DigitPrecision(w.winbox.height as number, "height"),
				kind: w.kind,
				title: w.winbox.title,
				params: w.params,
			} as WindowStateInferred);
		});
		return windowStates;
	}

	function updateUrl() {
		if (route.path === "/imprint") return;
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

	function updateQueryParam(id: WindowItem["id"], query: string) {
		const w = registry.value.get(id);
		if (typeof w.params.query !== "undefined") {
			w.params.query = query;
			updateUrl();
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
	};
});
