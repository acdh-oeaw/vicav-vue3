import { nanoid } from "nanoid";
import WinBox from "winbox";
import { z } from "zod";

import {
	QueryString,
	Schema,
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
		const { title, targetType, params } = windowState;

		const ci = TextId.safeParse(params);
		if (ci.success) {
			const w = findWindowByTextId(targetType, String(ci.data.textId));
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

		if (ci.success) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			winbox.addControl({
				index: 0,
				class: "wb-tei",
				click: function () {
					const env = useRuntimeConfig();
					if (env.public.NUXT_PUBLIC_TEI_BASEURL) {
						window.open(`${env.public.NUXT_PUBLIC_TEI_BASEURL}&id=${ci.data.textId}`, "_blank");
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
	}

	function findWindowByTextId(targetType: WindowItemTargetType, textId: string): WindowItem | null {
		let foundWindow: WindowItem | null = null;
		registry.value.forEach((w) => {
			const ci = TextId.safeParse(w.params);
			if (
				foundWindow === null &&
				w.targetType === targetType &&
				ci.success &&
				ci.data.textId === textId
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
							.map((a) => "\\u" + a.charCodeAt(0).toString(16).padStart(4, "0"))
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
	};
});
