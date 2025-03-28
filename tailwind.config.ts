import typographyPlugin from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config = {
	content: [
		"./app.vue",
		"./error.vue",
		"./components/**/*.@(ts|tsx|vue)",
		"./layouts/**/*.@(ts|tsx|vue)",
		"./pages/**/*.@(ts|tsx|vue)",
		"./styles/**/*.css",
		"./composables/**/*.@(ts|tsx|vue)",
	],
	darkMode: ["class", 'data-ui-color-scheme="dark"'],
	plugins: [animatePlugin, typographyPlugin],
	theme: {
		extend: {
			borderRadius: {
				sm: "var(--radius-sm)",
				md: "var(--radius-md)",
				lg: "var(--radius-lg)",
			},
			colors: {
				background: "hsl(var(--color-background) / <alpha-value>)",
				"on-background": "hsl(var(--color-on-background) / <alpha-value>)",
				surface: "hsl(var(--color-surface) / <alpha-value>)",
				"on-surface": "hsl(var(--color-on-surface) / <alpha-value>)",
				overlay: "hsl(var(--color-overlay) / <alpha-value>)",
				"on-overlay": "hsl(var(--color-on-overlay) / <alpha-value>)",
				muted: "hsl(var(--color-muted) / <alpha-value>)",
				"on-muted": "hsl(var(--color-on-muted) / <alpha-value>)",
				primary: "hsl(var(--color-primary) / <alpha-value>)",
				"on-primary": "hsl(var(--color-on-primary) / <alpha-value>)",
				secondary: "hsl(var(--color-secondary) / <alpha-value>)",
				"on-secondary": "hsl(var(--color-on-secondary) / <alpha-value>)",
				accent: "hsl(var(--color-accent) / <alpha-value>)",
				"on-accent": "hsl(var(--color-on-accent) / <alpha-value>)",
				header: "hsl(var(--color-header) / <alpha-value>)",
				"on-header": "hsl(var(--color-on-header) / <alpha-value>)",
				negative: "hsl(var(--color-negative) / <alpha-value>)",
				"on-negative": "hsl(var(--color-on-negative) / <alpha-value>)",
				border: "hsl(var(--color-border) / <alpha-value>)",
				input: "hsl(var(--color-input) / <alpha-value>)",
				ring: "hsl(var(--color-ring) / <alpha-value>)",
			},
			fontFamily: {
				body: ["var(--font-sans, ui-sans-serif)", "system-ui", "sans-serif"],
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"collapsible-down": {
					from: { height: "0" },
					to: { height: "var(--radix-collapsible-content-height)" },
				},
				"collapsible-up": {
					from: { height: "var(--radix-collapsible-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"collapsible-down": "collapsible-down 0.2s ease-in-out",
				"collapsible-up": "collapsible-up 0.2s ease-in-out",
			},
		},
	},
} satisfies Config;

export default config;
