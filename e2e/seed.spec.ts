import { expect, test } from "@playwright/test";

test.describe("Test group", () => {
	test("seed", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// generate code here.
	});
});
