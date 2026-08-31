// e2e/fixtures.ts
import { test as base } from "@playwright/test";
import { CacheRoute } from "playwright-network-cache";

interface Fixtures {
	cacheRoute: CacheRoute;
}

export const test = base.extend<Fixtures>({
	// `auto: true` makes this run for every test automatically —
	// no need to call it manually before each `page.goto`.
	cacheRoute: [
		async ({ page }, use) => {
			const cacheRoute = new CacheRoute(page, {
				baseDir: ".cache",
			});

			// Cache the actual document response for the root route.
			await cacheRoute.GET("/", { ttlMinutes: 3 });

			// Cache static assets referenced by the page (JS/CSS/fonts/images),
			// so the whole page load is served from disk on repeat runs.
			await cacheRoute.GET("**/*.{js,mjs,css,png,jpg,jpeg,svg,gif,webp,woff,woff2,ttf,eot,ico}", {
				ttlMinutes: 3,
			});

			await use(cacheRoute);
		},
		{ auto: true },
	],
});

export { expect } from "@playwright/test";
