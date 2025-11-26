import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./app", import.meta.url)),
		"~": fileURLToPath(new URL("./", import.meta.url)),
	},

	app: {
		layoutTransition: false,
		pageTransition: false,
	},

	components: [{ path: "@/components", extensions: [".vue"], pathPrefix: false }],

	css: [
		"@fontsource-variable/roboto-flex/standard.css",
		"@/styles/index.css",
		"winbox/dist/css/winbox.min.css",
		"leaflet/dist/leaflet.css",
	],

	devtools: {
		enabled: false, //process.env.NODE_ENV === "development",
		//https://github.com/nuxt/devtools/issues/722
		componentInspector: false,
	},

	eslint: {
		config: {
			autoInit: false,
			standalone: false,
		},
	},

	imports: { dirs: ["./config/"] },
	modules: [
		"@pinia/nuxt",
		"@vueuse/nuxt",
		"@nuxt/eslint",
		"@nuxt/test-utils/module",
		"nuxt-svgo",
		"nitro-opentelemetry",
	],
	nitro: {
		compressPublicAssets: true,
		otel: {
			preset: {
				name: "custom",
				filePath: "./server/instrumentation.ts",
			},
		},
	},

	postcss: {
		plugins: {
			autoprefixer: {},
		},
	},

	routeRules: {
		"/**": {
			headers: process.env.BOTS !== "enabled" ? { "X-Robots-Tag": "noindex, nofollow" } : {},
		},
	},

	runtimeConfig: {
		// The values here are defaults or sample values.
		// They are magically replaced with environment variables at runtime.
		// Variables need to start with NUXT_ or NUXT_PUBLIC_.
		// See https://nuxt.com/docs/guide/runtime-config
		BOTS: "disabled",
		apiBaseUrl: undefined,
		public: {
			apiBaseUrl: "https://vicav-dev.acdh.oeaw.ac.at",
			appBaseUrl: "http://localhost:3000",
			mapTileLayerAttribution:
				"https://api.mapbox.com/styles/v1/acdh-ch-tech/cllp2n7aj004a01r7fl637bq1/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWNkaC1jaC10ZWNoIiwiYSI6ImNsZXpnMDdpODBlc2Q0MGwzOGZmaWNveDgifQ.yYx8e9PdsDl-NzOpGXAL7g",
			mapTileLayerUrl:
				'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
			matomoBaseUrl: "",
			matomoId: "",
			redmineId: "",
			teiBaseurl: "https://github.com/acdh-oeaw/vicav-content",
			apiUser: undefined,
			apiPass: undefined,
			// This variable is replaced with the environment variable NUXT_PUBLIC_CURRENT_GIT_SHA at build time.
			currentGitSha: process.env.NUXT_PUBLIC_CURRENT_GIT_SHA ?? "development",
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
		build: {
			cssMinify: "lightningcss",
		},
		plugins: [tailwindcss()],
	},

	typescript: {
		shim: false,
		strict: true,
		// https://github.com/nuxt/nuxt/issues/14816#issuecomment-1484918081
		tsConfig: {
			compilerOptions: {
				baseUrl: ".",
				paths: {
					"@/*": ["./app/*"],
					"~/*": ["./*"],
				},
			},
			include: ["../*.config.ts", "../i18n/*.config.ts", "../e2e/**/*.ts"],
		},
	},
});
