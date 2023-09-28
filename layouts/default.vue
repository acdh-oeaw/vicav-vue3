<script lang="ts" setup>
import { isNonEmptyString } from "@acdh-oeaw/lib";
import color from "color";
import type { WebSite, WithContext } from "schema-dts";

const env = useRuntimeConfig();
const route = useRoute();

const { data, suspense } = useProjectInfo();
await suspense();

const siteTitle = computed(() => {
	return data.value?.projectConfig?.title ?? "VICAV3.0 - Vienna Corpus of Arabic Varieties";
});

function toHsl(hex: string): string {
	// @ts-expect-error Upstream types are outdated.
	const [h, s, l] = color(hex).hsl().color;
	return `${h}deg ${s}% ${l}%`;
}

const style = computed(() => {
	const colors = data.value?.projectConfig?.styleSettings?.colors;

	if (colors?.subNav == null) return undefined;

	return `--color-primary: ${toHsl(colors.subNav)};`;
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
</script>

<template>
	<div class="grid min-h-full grid-rows-[auto_1fr_auto]">
		<SkipLink :target-id="mainContentId">Skip to main content</SkipLink>

		<AppHeader />
		<slot />
		<AppFooter />

		<Toaster />

		<RouteAnnouncer />
	</div>
</template>
