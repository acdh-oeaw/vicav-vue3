import { expect, test } from "@playwright/test";

test.describe("Test group", () => {
	test("seed", async ({ page }) => {
		await page.goto("http://127.0.0.1:3000/");
		await expect(page.locator("#window-root")).toBeInViewport();
		// generate code here.
	});
});
