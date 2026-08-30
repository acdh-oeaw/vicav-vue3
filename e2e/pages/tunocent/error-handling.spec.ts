import { expect, test } from "@playwright/test";

test.describe("Error Handling & Edge Cases", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// close initial About window
		await page.locator(".wb-close").first().click();
	});

	test("TC-034: Empty Search Results", async ({ page }) => {
		await page.getByRole("button", { name: "Feature Lists" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-035: Network Timeout", async ({ page }) => {
		await page.route("**/api/**", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 8000));
			await route.continue();
		});

		await page.getByRole("button", { name: "Profiles" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	// 404 tests are broken and a fix is not planned (playwright #33962)
	// They throw RESPONSE_CODE_FAILURE errors and return 200 or 404
});
