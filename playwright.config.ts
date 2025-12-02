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
			// http://localhost:8984 needs to be moved according to the backend running
			return "vicav";
		case "https://shawi.acdh-ch-dev.oeaw.ac.at":
		case "http://localhost:8984":
			// case "https://shawi-api.acdh.oeaw.ac.at": This is the next production backend.
			return "shawi";
		case "https://tunocent-22a417b1-9f07-406b-9098-288b3f981d99.acdh-ch-dev.oeaw.ac.at/":
		case "https://tunocent-api.acdh.oeaw.ac.at/":
			return "tunocent";
		case "https://wibarab-api.acdh-ch-dev.oeaw.ac.at/":
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
			throw new Error("unknown backend");
	}
})();

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: "html",
	testMatch: `${backend}/*.test.ts`,
	use: {
		baseURL: baseUrl,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
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
