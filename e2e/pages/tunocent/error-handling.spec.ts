import { expect, test } from "@playwright/test";

test.describe("Error Handling & Edge Cases", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("TC-034: Empty Search Results", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Feature Lists" }).click();

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

		await page.getByRole("menuitem", { name: "Profiles" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-036: Invalid URL", async ({ page }) => {
		const response = await page.goto("/invalid-page-12345");
		expect([200, 404]).toContain(response?.status());
	});
});
