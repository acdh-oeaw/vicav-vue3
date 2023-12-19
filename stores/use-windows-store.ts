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

export const ContentId = z.object({
	id: z.string(),
});
export const QueryString = z.object({
	queryString: z.string(),
});

export const BibliographyEntriesSchema = z.object({
	kind: z.literal("BiblioEntries"),
	params: QueryString.merge(
		z.object({
			xslt: z.string().optional(),
		}),
	),
});
export type BibliographyEntriesWindowItem = WindowItemBase &
	z.infer<typeof BibliographyEntriesSchema>;

export const FeatureSchema = z.object({
	kind: z.literal("Feature"),
	params: ContentId,
});
export type FeatureWindowItem = WindowItemBase & z.infer<typeof FeatureSchema>;

export const GeoMapSchema = z.object({
	kind: z.literal("WMap"),
	params: z.object({
		endpoint: z.string(),
		query: z.string().optional(),
		scope: z.enum(["reg", "geo", "diaGroup"]).optional(),
	}),
});
export type GeoMapWindowItem = WindowItemBase & z.infer<typeof GeoMapSchema>;

export const ProfileSchema = z.object({
	kind: z.literal("Profile"),
	params: ContentId,
});
export type ProfileWindowItem = WindowItemBase & z.infer<typeof ProfileSchema>;

export const TextSchema = z.object({
	kind: z.literal("Text"),
	params: ContentId,
});
export type TextWindowItem = WindowItemBase & z.infer<typeof TextSchema>;

export const Schema = z.discriminatedUnion("kind", [
	BibliographyEntriesSchema,
	FeatureSchema,
	GeoMapSchema,
	ProfileSchema,
	TextSchema,
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
		const { title, kind, params } = windowState;

		if (ContentId.safeParse(params).success) {
			const w = findWindowByContentId(kind, params.id as string);
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

		registry.value.set(id, {
			id,
			winbox,
			kind,
			params,
		} as WindowItem);
	}

	function findWindowByContentId(kind: WindowItemKind, contentId: string): WindowItem | null {
		let foundWindow: WindowItem | null = null;
		registry.value.forEach((w) => {
			if (
				foundWindow === null &&
				w.kind === kind &&
				ContentId.safeParse(w.params).success &&
				w.params.id === contentId
			) {
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
			return String(Math.floor((10000 * x) / viewport[dir]) / 100) + "%";
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
			} as WindowState);
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
		if (QueryString.safeParse(w.params).success) {
			w.params.query = query;
			w.winbox.setTitle(query);
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
