import { expect, test } from "@playwright/test";

// AI generated MiniMax-M2.5 April 2026, edited

test.describe("Desktop Menu Rendering", () => {
	test("should render desktop menu items from API on desktop viewport", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Verify page loads without errors
		await expect(page).toHaveTitle(/VICAV/);

		// Verify desktop menu (NavigationMenu) is visible on desktop viewport (≥1024px)
		await expect(page.locator("[data-slot=navigation-menu]")).toBeVisible();

		// Verify all menu category triggers are visible
		// (scoped to the menu list to avoid same-named buttons elsewhere)
		const triggers = page.locator("[data-slot=navigation-menu-list]");
		await expect(triggers.getByRole("button", { name: "Project", exact: true })).toBeVisible();
		await expect(
			triggers.getByRole("button", { name: "Bibliographies", exact: true }),
		).toBeVisible();
		await expect(triggers.getByRole("button", { name: "Profiles", exact: true })).toBeVisible();
		await expect(
			triggers.getByRole("button", { name: "Feature Lists", exact: true }),
		).toBeVisible();
		await expect(triggers.getByRole("button", { name: "Samples", exact: true })).toBeVisible();
		await expect(triggers.getByRole("button", { name: "Texts", exact: true })).toBeVisible();
		await expect(triggers.getByRole("button", { name: "Dictionaries", exact: true })).toBeVisible();
		await expect(
			triggers.getByRole("button", { name: "Tools & Technology", exact: true }),
		).toBeVisible();
		// The Windows dropdown is still a Menubar
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
	});

	test("should hide desktop menu on mobile viewport", async ({ page }) => {
		// Set viewport to mobile size
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Verify desktop menu is NOT visible on mobile viewport (<1024px)
		await expect(page.locator("[data-slot=navigation-menu]")).toBeHidden();
	});

	test("should show mobile menu toggle on small viewport", async ({ page }) => {
		// Set viewport to mobile size
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Verify mobile menu toggle button is visible
		await expect(page.getByRole("button", { name: /Toggle navigation/i })).toBeVisible();
	});
});
