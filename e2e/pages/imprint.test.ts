import { expect, test } from "@playwright/test";

test.describe("imprint page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/imprint");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav.acdh-ch-dev.oeaw.ac.at":
				await expect(page).toHaveTitle("Imprint | VICAV3.0 - Vienna Corpus of Arabic Varieties");
				break;
			case "https://wibarab-api.acdh-ch-dev.oeaw.ac.at":
				await expect(page).toHaveTitle("Imprint | WIBARAB");
				break;
			case "https://tunocent-vicav.acdh-dev.oeaw.ac.at":
				await expect(page).toHaveTitle("Imprint | TUNOCENT");
				break;
			default:
				await expect(page).toHaveTitle("Imprint | VICAV3.0 - Vienna Corpus of Arabic Varieties");
		}
	});

	test("should have imprint text", async ({ page }) => {
		await page.goto("/imprint");
		await expect(page.getByRole("main")).toContainText("Legal disclosure");
	});
});
