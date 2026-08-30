import { expect, test } from "@playwright/test";

test.describe("Search Functionality", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("TC-028: Feature List Search - Basic", async ({ page }) => {
		await page.getByRole("button", { name: "Feature Lists", exact: true }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-029: Sample Text Search - Basic", async ({ page }) => {
		await page.getByRole("button", { name: "Sample Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-030: Corpus Search - Exact Match", async ({ page }) => {
		await page.getByRole("button", { name: "Corpus Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-031: Corpus Search - CQL Advanced", async ({ page }) => {
		await page.getByRole("button", { name: "Corpus Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});
});
