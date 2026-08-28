import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Bibliographies Dropdown", () => {
	test("should open Bibliographies menu and display all 8 items", async ({ page }) => {
		// 1. Navigate to the homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on the "Bibliographies" trigger
		// (scoped to the menu list to avoid same-named buttons elsewhere)
		const trigger = page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Bibliographies", exact: true });
		await trigger.click();

		// expect: Bibliographies menu should be expanded
		await expect(trigger).toHaveAttribute("aria-expanded", "true");

		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

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
			await expect(content.getByRole("button", { name: item })).toBeVisible();
		}

		// expect: Dropdown should display all 8 menu items with proper separators
		const dropdownItems = content.locator("[data-slot=navigation-menu-link]");
		await expect(dropdownItems).toHaveCount(8);
	});
});
