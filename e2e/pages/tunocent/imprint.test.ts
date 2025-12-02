import { expect, test } from "@playwright/test";

test.describe("imprint page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/imprint");
		await expect(page).toHaveTitle(
			"Imprint | TUNOCENT - Tunisia’s Linguistic terra incognita: An Investigation into the Arabic Varieties of Northwestern and Central Tunisia",
		);
	});

	test("should have imprint text", async ({ page }) => {
		await page.goto("/imprint");
		await expect(page.getByRole("main")).toContainText("Legal disclosure");
	});
});
