import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Feature Lists Dropdown", () => {
	test("should open Feature Lists menu and display all 4 items", async ({ page }) => {
		// 1. Click on "Feature Lists" menu item
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Feature Lists" }).click();

		// Get reference to the dropdown menu
		const dropdown = page.locator("[role='menu']").last();

		// 2. Verify dropdown contains:
		const expectedItems = [
			"Explanation",
			"Cross-examine the VICAV Feature Lists",
			"Show All Feature Lists on Map",
			"Contribute a Feature List",
		];

		for (const item of expectedItems) {
			await expect(dropdown.getByRole("menuitem", { name: item })).toBeVisible();
		}

		// expect: All 4 menu items are visible and clickable
		const dropdownItems = dropdown.locator("[role='menuitem']");
		await expect(dropdownItems).toHaveCount(4);
	});
});
