import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Dictionaries Dropdown", () => {
	test("should open Dictionaries menu and display all 10 items", async ({ page }) => {
		// 1. Click on "Dictionaries" trigger
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Dictionaries", exact: true })
			.click();

		// Get reference to the dropdown content
		const dropdown = page.locator("[data-slot=navigation-menu-content]");
		await expect(dropdown).toBeVisible();

		// 2. Verify dropdown contains:
		const expectedItems = [
			"All Dictionaries in Bibl. on Map",
			"All VICAV Dictionaries on Map",
			"Query the VICAV Dictionaries",
			"TUNICO Dictionary",
			"Damascus Dictionary",
			"Cairo Dictionary",
			"Baghdad Dictionary",
			"MSA Dictionary",
			"Technicalities",
			// Live vicav-dev item name is "Contribute a Dictionary/Glossary";
			// getByRole name matching is a substring match by default.
			"Contribute a Dictionary",
		];

		for (const item of expectedItems) {
			await expect(dropdown.getByRole("button", { name: item })).toBeVisible();
		}

		// expect: All 10 menu items are visible with proper separators
		const dropdownItems = dropdown.locator("[data-slot=navigation-menu-link]");
		await expect(dropdownItems).toHaveCount(10);
	});
});
