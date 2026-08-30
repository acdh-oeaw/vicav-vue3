import { expect, test } from "@playwright/test";

test.describe("Research Section", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("TC-017: Research - Publications", async ({ page }) => {
		await page.getByRole("button", { name: "Research" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-018: Research - Presentations", async ({ page }) => {
		await page.getByRole("button", { name: "Research" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-019: Research - Conference", async ({ page }) => {
		await page.getByRole("button", { name: "Research" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});
});
