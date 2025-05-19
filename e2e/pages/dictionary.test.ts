/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import { expect, test } from "@playwright/test";

test.describe("dictionary page", () => {
	test("should open dictionary and query window from appropriate menu", async ({ page }) => {
		await page.goto("/?w=W10=&a=smart-tile");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await page.getByRole("menuitem", { name: "Dictionaries" }).click();
				await page.getByRole("menuitem", { name: "TUNICO Dictionary" }).click();
				await expect(
					page
						.locator("div")
						.filter({ hasText: /^TUNICO Dictionary$/ })
						.nth(1),
				).toBeVisible();
				await page.getByRole("link", { name: "here" }).click();
				await expect(
					page
						.locator("div")
						.filter({ hasText: /^Tunis Dictionary Query$/ })
						.nth(1),
				).toBeVisible();
				break;
		}
	});
	test("should open dictionary and query window from appropriate menu", async ({ page }) => {
		await page.goto("/?w=W10=&a=smart-tile");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await page.getByRole("menuitem", { name: "Dictionaries" }).click();
				await page.getByRole("menuitem", { name: "TUNICO Dictionary" }).click();
				await page.getByRole("link", { name: "here" }).click();
				break;
		}
	});
});
