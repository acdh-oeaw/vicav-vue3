import { expect, test } from "@playwright/test";

test.describe("imprint page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/imprint");
		if (
			process.env.K8S_SECRET_NUXT_PUBLIC_API_BASE_URL === "https://vicav.acdh-ch-dev.oeaw.ac.at/"
		) {
			await expect(page).toHaveTitle("Imprint | VICAV3.0 - Vienna Corpus of Arabic Varieties");
		} else if (
			process.env.K8S_SECRET_NUXT_PUBLIC_API_BASE_URL ===
			"https://wibarab-api.acdh-ch-dev.oeaw.ac.at/"
		) {
			await expect(page).toHaveTitle("Imprint | WIBARAB");
		} else {
			await expect(page).toHaveTitle("Imprint | TUNOCENT");
		}
	});

	test("should have imprint text", async ({ page }) => {
		await page.goto("/imprint");
		await expect(page.getByRole("main")).toContainText("Legal disclosure");
	});
});
