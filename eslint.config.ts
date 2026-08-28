import { resolve } from "node:path";

import baseConfig from "@acdh-oeaw/eslint-config";
import nodeConfig from "@acdh-oeaw/eslint-config-node";
import nuxtConfig from "@acdh-oeaw/eslint-config-nuxt";
import playwrightConfig from "@acdh-oeaw/eslint-config-playwright";
import tailwindcssConfig from "@acdh-oeaw/eslint-config-tailwindcss";
import vueConfig from "@acdh-oeaw/eslint-config-vue";
import { defineConfig } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";

import { withNuxt } from "./.nuxt/eslint.config.mjs";

const configs = defineConfig(
	{
		ignores: [".cache/**", ".heroku/**", "./*.js", "./*.mjs", "app/assets/openapi.json"],
	},
	gitignore({ strict: false }),
	baseConfig,
	vueConfig,
	nuxtConfig,
	tailwindcssConfig,
	{
		settings: {
			"better-tailwindcss": {
				entryPoint: resolve("./app/styles/index.css"),
			},
		},
		rules: {
			"better-tailwindcss/no-unknown-classes": [
				"error",
				{
					ignore: [
						"^aVicText$",
						"^biblQueryBtn$",
						"^corpus-utterance$",
						"^dvStats$",
						"^footer-logo-widget$",
						"^ib(?:-[a-z-]+)?$",
						"^ie(?:-[a-z-]+)?$",
						"^not-prose$",
						"^play$",
						"^spQueryText$",
						"^stop$",
						"^svg-icon$",
						"^titlestring$",
						"^u$",
						"^vh$",
					],
				},
			],
		},
	},
	playwrightConfig,
	{
		files: ["**/*.vue"],
		rules: {
			"vue/attributes-order": ["warn", { alphabetical: true }],
		},
	},
	{
		files: ["./server/**/*.ts"],
		extends: [nodeConfig],
	},
);

export default withNuxt(configs);
