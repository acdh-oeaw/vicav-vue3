import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Bibliographies Dropdown", () => {
	test("should open Bibliographies menu and display all 8 items", async ({ page }) => {
		// 1. Navigate to the homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on the "Bibliographies" menu item
		await page.getByRole("menuitem", { name: "Bibliographies" }).click();

		// expect: Bibliographies menu should be expanded
		await expect(page.getByRole("menuitem", { name: "Bibliographies" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);

		// 3. Verify the dropdown menu appears with the following items:
		const expectedItems = [
			"Explanation",
			"All Bibl. Locations on Map",
			"All Bibl. Regions on Map",
			"All Bibl. Dialect Regions on Map",
			"All Dictionaries in Bibl. on Map",
			"All Textbooks in Bibl. on Map",
			"Query Bibliography",
			"Contribute to the Bibliography",
		];

		for (const item of expectedItems) {
			await expect(page.getByRole("menuitem", { name: item })).toBeVisible();
		}

		// expect: Dropdown should display all 8 menu items with proper separators
		const dropdownItems = page.locator("[role='menu'] >> role=menuitem");
		await expect(dropdownItems).toHaveCount(8);
	});
});
