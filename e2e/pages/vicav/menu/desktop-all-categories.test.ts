import { expect, test } from "@playwright/test";

// AI generated MiniMax-M2.5 April 2026, edited

test.describe("Desktop Menu - All Categories Visible", () => {
	test("should display all 9 desktop menu categories", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Verify all 9 menu categories are visible in the navigation bar.
		// The 8 main menu triggers are buttons inside the NavigationMenu;
		// the Windows dropdown is still a Menubar (menuitem).
		const triggers = page.locator("[data-slot=navigation-menu-list]");
		const menuCategories = [
			"Project",
			"Bibliographies",
			"Profiles",
			"Feature Lists",
			"Samples",
			"Texts",
			"Dictionaries",
			"Tools & Technology",
		];

		for (const category of menuCategories) {
			await expect(triggers.getByRole("button", { name: category, exact: true })).toBeVisible();
		}
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();

		// Count the number of main menu triggers to verify exactly 8
		// Linter suggested not to use count toBe.
		const menuItems = triggers.getByRole("button");
		await expect(menuItems).toHaveCount(8);
	});
});
