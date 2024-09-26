/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
				break;
			case "https://wibarab-api.acdh-ch-dev.oeaw.ac.at":
				await expect(page).toHaveTitle("Home | WIBARAB");
				break;
			case "https://tunocent-22a417b1-9f07-406b-9098-288b3f981d99.acdh-ch-dev.oeaw.ac.at":
				await expect(page).toHaveTitle("Home | TUNOCENT");
				break;
			default:
				await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
		}
	});
});
