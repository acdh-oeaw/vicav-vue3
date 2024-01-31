<script lang="ts" setup>
import { isNonEmptyString, noop } from "@acdh-oeaw/lib";
import { ColorSpace, getLuminance, HSL, parse, sRGB, to as convert } from "colorjs.io/fn";
import type { WebSite, WithContext } from "schema-dts";

ColorSpace.register(sRGB);
ColorSpace.register(HSL);

const env = useRuntimeConfig();
const route = useRoute();

const { data, suspense } = useProjectInfo();
onServerPrefetch(async () => {
	/**
	 * @see https://github.com/TanStack/query/issues/6606
	 * @see https://github.com/TanStack/query/issues/5976
	 */
	await suspense().catch(noop);
});

const siteTitle = computed(() => {
	return data.value?.projectConfig?.title ?? "VICAV3.0 - Vienna Corpus of Arabic Varieties";
});

function convertColor(hex: string): [string, string] {
	const color = convert(parse(hex), "hsl");
	const contrast = getLuminance(color) > 0.5 ? "0deg 0% 0%" : "0deg 0% 100%";
	const [h, s, l] = color.coords;
	return [`${h}deg ${s}% ${l}%`, contrast];
}

const style = computed(() => {
	const colors = data.value?.projectConfig?.styleSettings?.colors;

	const style = [];

	if (colors?.nav != null) {
		const [color, contrast] = convertColor(colors.nav);
		style.push(`--color-header: ${color}`);
		style.push(`--color-on-header: ${contrast}`);
	}

	if (colors?.subNav != null) {
		const [color, contrast] = convertColor(colors.subNav);
		const primaryCoords = convert(parse(`hsl(${color})`), "srgb")
			.coords.map((x) => Math.floor(256 * x))
			.join(" ");
		style.push(`--color-primary-500: ${primaryCoords}`);
		style.push(`--color-on-primary: ${contrast}`);
	}

	return style.join(";");
});

useHead({
	htmlAttrs: {
		lang: defaultLocale,
		style,
	},
	titleTemplate: computed(() => {
		return ["%s", siteTitle.value].join(" | ");
	}),
	title: computed(() => {
		return route.meta.title;
	}),
	link: computed(() => {
		return [
			{ href: "/favicon.ico", rel: "icon", sizes: "any" },
			{ href: "/icon.svg", rel: "icon", type: "image/svg+xml", sizes: "any" },
			{ href: "/apple-icon.png", rel: "apple-touch-icon" },
		];
	}),
	meta: computed(() => {
		return [
			{ name: "description", content: route.meta.description },
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: route.meta.title },
			{ property: "og:site_name", content: data.value?.projectConfig?.title },
			{ property: "og:description", content: route.meta.description },
			{ property: "og:image", content: "/opengraph-image.png" },
			{ property: "og:locale", content: defaultLocale },
		];
	}),
	script: computed(() => {
		const jsonLd: WithContext<WebSite> = {
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: route.meta.title,
			description: route.meta.description,
		};

		const scripts = [
			{ type: "application/ld+json", innerHTML: JSON.stringify(jsonLd, safeJsonLdReplacer) },
		];

		if (
			isNonEmptyString(env.public.NUXT_PUBLIC_MATOMO_BASE_URL) &&
			isNonEmptyString(env.public.NUXT_PUBLIC_MATOMO_ID)
		) {
			scripts.push({
				type: "",
				innerHTML: createAnalyticsScript(
					env.public.NUXT_PUBLIC_MATOMO_BASE_URL,
					env.public.NUXT_PUBLIC_MATOMO_ID,
				),
			});
		}

		return scripts;
	}),
});

/**
 * We only want to display windows on the root route.
 *
 * We always render the window manager in the layout, to avoid remounting the window root,
 * and consequently having to manually mount/unmount every single window.
 */
const isWindowManagerVisible = computed(() => {
	return route.path === "/";
});
</script>

<template>
	<div class="grid max-h-screen min-h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-neutral-50">
		<SkipLink :target-id="mainContentId">Skip to main content</SkipLink>

		<AppHeader />
		<MainContent>
			<slot />

			<div :class="{ hidden: !isWindowManagerVisible }" class="relative isolate grid h-full w-full">
				<WindowManager />
			</div>
		</MainContent>
		<AppFooter />
		<Toaster />
		<RouteAnnouncer />
	</div>
</template>
