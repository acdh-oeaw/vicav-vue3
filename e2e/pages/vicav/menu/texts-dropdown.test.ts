import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Texts Dropdown", () => {
	test("should open Texts menu and display the single item", async ({ page }) => {
		// 1. Click on "Texts" menu item
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Texts" }).click();

		// Get reference to the dropdown menu
		const dropdown = page.locator("[role='menu']").last();

		// 2. Verify dropdown contains:
		await expect(
			dropdown.getByRole("menuitem", { name: "Explanation and Overview" }),
		).toBeVisible();

		// expect: Single menu item is visible
		const dropdownItems = dropdown.locator("[role='menuitem']");
		await expect(dropdownItems).toHaveCount(1);
	});
});
