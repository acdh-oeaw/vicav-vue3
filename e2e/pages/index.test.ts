import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/");
		if (
			process.env.K8S_SECRET_NUXT_PUBLIC_API_BASE_URL === "https://vicav.acdh-ch-dev.oeaw.ac.at/"
		) {
			await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
		} else if (
			process.env.K8S_SECRET_NUXT_PUBLIC_API_BASE_URL ===
			"https://wibarab-api.acdh-ch-dev.oeaw.ac.at/"
		) {
			await expect(page).toHaveTitle("Home | WIBARAB");
		} else {
			await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
		}
	});
});
