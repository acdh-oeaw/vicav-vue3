import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./app", import.meta.url)),
		"~": fileURLToPath(new URL("./", import.meta.url)),
	},

	sourcemap: {
		server: true,
		client: true,
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

	features: {
		// This pushes some logs to the client using ssr.
		// Part of these logs is a timestamp so it will always change and prevent caching
		// of compressed ssr data.
		devLogs: false,
	},

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
		"v-onboarding/nuxt",
	],
	nitro: {
		compressPublicAssets: true,
		otel: {
			preset: {
				name: "custom",
				filePath: "./server/instrumentation.ts",
			},
		},
		storage: {
			compression: {
				driver: "lruCache",
				ttl: 15 * 60 * 1000,
				max: 100,
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
		// Server-only: the NoSketch Engine instance is proxied through /api/cql-attributes
		// because it does not send CORS headers (browser cannot call it directly).
		noskeBaseUrl: "https://shawi-noske-main.acdh-dev.oeaw.ac.at",
		noskeCorpus: "shawi",
		public: {
			apiBaseUrl: "https://vicav-dev.acdh.oeaw.ac.at",
			appBaseUrl: "http://localhost:3000",
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
		optimizeDeps: {
			include: [
				"pinia",
				"@tanstack/vue-query",
				"nanoid",
				"zod",
				"@acdh-oeaw/lib",
				"colorjs.io/fn",
				"@lucide/vue",
				"radix-vue",
				"cva",
				"winbox",
				"liqe", // CJS
				"v3-infinite-loading",
				"@tanstack/vue-table",
				"lightgallery",
				"colorjs.io",
				"@iconify/vue",
				"@citation-js/plugin-csl",
				"@citation-js/core",
				"@maplibre/maplibre-gl-leaflet", // CJS
				"leaflet", // CJS
				"maplibre-gl", // CJS
				"tailwind-merge",
				"reka-ui",
				"@jpinsonneau/html-to-image",
				"@codemirror/language",
				"@codemirror/view",
				"vue-codemirror6",
				"class-variance-authority",
				"@lezer/highlight",
				"vee-validate",
				"@unovis/vue",
				"@unovis/ts",
			],
		},
	},

	vOnboarding: {
		// Auto-import VOnboardingWrapper and VOnboardingStep
		components: true,
		// Auto-import useVOnboarding composable
		composables: true,
		// Include v-onboarding styles
		css: true,
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
			include: ["../*.config.ts", "../e2e/**/*.ts", "../lib/**/*.ts"],
		},
	},

	compatibilityDate: "2026-01-01",
});
