// import "dotenv/config";

import { defineConfig, devices } from "@playwright/test";
import { isCI } from "ci-info";

const port = 3000;
const baseUrl = `http://localhost:${port.toString()}`;

const backend = (() => {
	// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
	switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
		case "https://vicav-dev.acdh.oeaw.ac.at":
		case "https://vicav.acdh.oeaw.ac.at":
		case "http://localhost:8984":
			// http://localhost:8984 needs to be moved according to the backend running
			return "vicav";
		case "https://shawi.acdh-ch-dev.oeaw.ac.at":
			// case "https://shawi-api.acdh.oeaw.ac.at": This is the next production backend.
			return "shawi";
		case "https://tunocent-api.acdh-dev.oeaw.ac.at":
		case "https://tunocent-api.acdh.oeaw.ac.at":
			return "tunocent";
		case "https://wibarab-api.acdh-ch-dev.oeaw.ac.at":
			return "wibarab";
		default:
			// in VSCode there is "playwright.env" in settings.conf for the playwright running in the UI.
			// Example:
			//   "playwright.env": {
			//     "NUXT_PUBLIC_API_BASE_URL": "http://localhost:8984"
			//   }
			// }
			// If nothing is set in settings.conf file or the OS environment the UI will show the tests
			// failing here:
			throw new Error(`Unknown backend ${process.env.NUXT_PUBLIC_API_BASE_URL ?? "undefined"}`);
		// The backends _should_ _not_ end in a /
	}
})();

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	failOnFlakyTests: isCI,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 3 : undefined,
	reporter: "html",
	testMatch: `${backend}/**/*.@(test|spec).ts`,
	use: {
		baseURL: baseUrl,
		trace: "on-first-retry",
		video: {
			mode: "on-first-retry",
			size: { width: 1920, height: 1080 },
			show: {
				actions: {
					duration: 500,
					position: "bottom-right",
					fontSize: 14,
				},
				test: {
					level: "step",
					position: "bottom-left",
					fontSize: 12,
				},
			},
		},
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], launchOptions: { args: ["--use-gl=angle"] } },
		},
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				launchOptions: {
					firefoxUserPrefs: {
						"dom.webgpu.enabled": true,
						"webgl.enable-webgl2": true,
					},
				},
			},
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ..devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],
	webServer: {
		command: "pnpm run start:local",
		url: baseUrl,
		reuseExistingServer: !isCI,
	},
});
