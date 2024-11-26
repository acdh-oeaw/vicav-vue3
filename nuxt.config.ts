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
		//https://github.com/nuxt/devtools/issues/722
		componentInspector: false,
	},

	eslint: {
		config: {
			standalone: true,
		},
	},

	imports: { dirs: ["./config/"] },
	modules: ["@pinia/nuxt", "@vueuse/nuxt", "@nuxt/eslint", "@nuxt/test-utils/module", "nuxt-svgo"],
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
			appBaseUrl: process.env.PUBLIC_URL ?? process.env.NUXT_PUBLIC_APP_BASE_URL,
			mapTileLayerAttribution: process.env.NUXT_PUBLIC_MAP_TILE_LAYER_ATTRIBUTION,
			mapTileLayerUrl: process.env.NUXT_PUBLIC_MAP_TILE_LAYER_URL,
			matomoBaseUrl: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			matomoId: process.env.NUXT_PUBLIC_MATOMO_ID,
			redmineId: process.env.NUXT_PUBLIC_REDMINE_ID,
			teiBaseurl: process.env.NUXT_PUBLIC_TEI_BASEURL,
			apiUser: process.env.NUXT_PUBLIC_API_USER,
			apiPass: process.env.NUXT_PUBLIC_API_PASS,
			currentGitSha: process.env.NUXT_PUBLIC_CURRENT_GIT_SHA,
		},
	},
	svgo: {
		defaultImport: "component",
		autoImportPath: "./assets/svg/",
		svgoConfig: {
			plugins: [
				{
					name: "preset-default",
					params: {
						overrides: {
							removeUselessDefs: false,
							cleanupIds: false,
						},
					},
				},
			],
		},
	},

	vite: {
		vue: {
			script: {
				defineModel: true,
			},
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
	future: {
		compatibilityVersion: 4,
	},
	compatibilityDate: "2024-09-20",
});
