import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./", import.meta.url)),
	},
	app: {
		layoutTransition: false,
		pageTransition: false,
	},
	components: [{ path: "@/components", extensions: [".vue"], pathPrefix: false }],
	css: [
		"@fontsource-variable/roboto-flex/standard.css",
		"tailwindcss/tailwind.css",
		"@/styles/index.css",
		"winbox/dist/css/winbox.min.css",
		"leaflet/dist/leaflet.css",
	],
	devtools: {
		enabled: process.env.NODE_ENV === "development",
	},
	imports: { dirs: ["./config/"] },
	modules: ["@pinia/nuxt", "@vueuse/nuxt"],
	nitro: { compressPublicAssets: true },
	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},
	routeRules: {
		"/**": {
			headers: process.env.BOTS !== "enabled" ? { "X-Robots-Tag": "noindex, nofollow" } : {},
		},
	},
	runtimeConfig: {
		BOTS: process.env.BOTS,
		public: {
			apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
			NUXT_PUBLIC_APP_BASE_URL: process.env.PUBLIC_URL ?? process.env.NUXT_PUBLIC_APP_BASE_URL,
			NUXT_PUBLIC_MAP_TILE_LAYER_ATTRIBUTION: process.env.NUXT_PUBLIC_MAP_TILE_LAYER_ATTRIBUTION,
			NUXT_PUBLIC_MAP_TILE_LAYER_URL: process.env.NUXT_PUBLIC_MAP_TILE_LAYER_URL,
			NUXT_PUBLIC_MATOMO_BASE_URL: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			NUXT_PUBLIC_MATOMO_ID: process.env.NUXT_PUBLIC_MATOMO_ID,
			NUXT_PUBLIC_REDMINE_ID: process.env.SERVICE_ID ?? process.env.NUXT_PUBLIC_REDMINE_ID,
			NUXT_PUBLIC_TEI_BASEURL: process.env.NUXT_PUBLIC_TEI_BASEURL,
		},
	},
	typescript: {
		shim: false,
		strict: true,
		// https://github.com/nuxt/nuxt/issues/14816#issuecomment-1484918081
		tsConfig: {
			compilerOptions: {
				paths: {
					"@/*": ["./*"],
				},
			},
		},
	},
});
