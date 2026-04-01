import { expect, test } from "@playwright/test";

// AI generated MiniMax-M2.5 April 2026, edited

test.describe("Desktop Menu - All Categories Visible", () => {
	test("should display all 9 desktop menu categories", async ({ page }) => {
		await page.goto("/");

		// Verify all 9 menu categories are visible in the navigation bar
		const menuCategories = [
			"Project",
			"Bibliographies",
			"Profiles",
			"Feature Lists",
			"Samples",
			"Texts",
			"Dictionaries",
			"Tools & Technology",
			"Windows",
		];

		for (const category of menuCategories) {
			await expect(page.getByRole("menuitem", { name: category })).toBeVisible();
		}

		// Count the number of menu items to verify exactly 9
		// Linter suggested not to use count toBe.
		const menuItems = page.getByRole("menuitem");
		await expect(menuItems).toHaveCount(9);
	});
});
