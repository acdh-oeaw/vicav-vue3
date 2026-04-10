import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Samples Dropdown", () => {
	test("should open Samples menu and display all 3 items", async ({ page }) => {
		// 1. Click on "Samples" menu item
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Samples" }).click();

		// Get reference to the dropdown menu
		const dropdown = page.locator("[role='menu']").last();

		// 2. Verify dropdown contains:
		const expectedItems = ["Explanation", "Show All Samples on Map", "Contribute a Sample Text"];

		for (const item of expectedItems) {
			await expect(dropdown.getByRole("menuitem", { name: item })).toBeVisible();
		}

		// expect: All 3 menu items are visible and clickable
		const dropdownItems = dropdown.locator("[role='menuitem']");
		await expect(dropdownItems).toHaveCount(3);
	});
});
