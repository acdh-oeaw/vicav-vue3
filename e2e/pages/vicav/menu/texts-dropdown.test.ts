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

		// 2. Verify dropdown contains:
		await expect(page.getByRole("menuitem", { name: "Explanation and Overview" })).toBeVisible();

		// expect: Single menu item is visible
		const dropdownItems = page.locator("[role='menu'] >> role=menuitem");
		await expect(dropdownItems).toHaveCount(1);
	});
});
