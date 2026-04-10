import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu - Category Expand", () => {
	test("should expand category to show sub-items on click", async ({ page }) => {
		// 1. Open mobile menu
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("button", { name: /Toggle menu/i }).click();

		// Mobile menu items don't have menuitem role, use getByText within the dialog
		const dialog = page.locator('[role="dialog"]');

		// 2. Click on "Bibliographies" category
		await dialog.getByText("Bibliographies", { exact: true }).first().click();

		// 3. Verify sub-items are displayed:
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
			await expect(dialog.getByText(item, { exact: true }).first()).toBeVisible();
		}

		// expect: Category expands to show all sub-items in a list
	});
});
