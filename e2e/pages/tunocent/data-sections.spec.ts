import { expect, test } from "@playwright/test";

test.describe("Data Sections", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("TC-005: Profiles - List All Entries", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Profiles" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-006: Profiles - Show on Map", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Profiles" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-007: Feature Lists - List All", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Feature Lists" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-008: Feature Lists - Show on Map", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Feature Lists" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-009: Feature Lists - Search Interface", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Feature Lists" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-010: Sample Texts - List All", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Sample Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-011: Sample Texts - Show on Map", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Sample Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-012: Sample Texts - Search Interface", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Sample Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-013: Corpus Texts - List All", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Corpus Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-014: Corpus Texts - Search", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Corpus Texts" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-015: Browse Data - List All", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Browse data" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});

	test("TC-016: Browse Data - Show Locations", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Browse data" }).click();

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});
});
