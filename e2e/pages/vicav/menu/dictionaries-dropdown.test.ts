import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Dictionaries Dropdown", () => {
	test("should open Dictionaries menu and display all 10 items", async ({ page }) => {
		// 1. Click on "Dictionaries" menu item
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Dictionaries" }).click();

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
			"Contribute a Dictionary/Glossary",
		];

		for (const item of expectedItems) {
			await expect(page.getByRole("menuitem", { name: item })).toBeVisible();
		}

		// expect: All 10 menu items are visible with proper separators
		const dropdownItems = page.locator("[role='menu'] >> role=menuitem");
		await expect(dropdownItems).toHaveCount(10);
	});
});
