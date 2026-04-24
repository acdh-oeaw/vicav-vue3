import { expect, test } from "@playwright/test";

test.describe("Homepage & Navigation", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("TC-001: Homepage Load", async ({ page }) => {
		await expect(page).toHaveTitle(/TUNOCENT/);
	});

	test("TC-002: Main Navigation Visible", async ({ page }) => {
		await expect(page.getByRole("menubar")).toBeVisible();

		const menuItems = [
			"About",
			"Profiles",
			"Feature Lists",
			"Sample Texts",
			"Corpus Texts",
			"Browse data",
			"Research",
		];

		for (const item of menuItems) {
			await expect(page.getByRole("menuitem", { name: item })).toBeVisible();
		}
	});

	test("TC-003: Navigation Menu Click", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Profiles" }).click();

		await page.getByRole("menuitem", { name: "Feature Lists" }).hover();

		await expect(page.locator(".window, [class*='window']").first()).toBeVisible();
	});

	test("TC-004: Windows Menu Click", async ({ page }) => {
		await page.getByRole("menuitem", { name: /^Windows/ }).click();

		await expect(page.getByRole("menuitem", { name: /^Windows/ })).toBeVisible();
	});
});
