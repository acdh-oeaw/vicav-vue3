import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
	});

	test("should not have any automatically detectable accessibility issues", async ({ page }) => {
		await page.goto("/");
		expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
	});
});
