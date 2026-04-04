import { expect, test } from "@playwright/test";

// AI generated MiniMax-M2.5 April 2026, edited

test.describe("Desktop Menu Rendering", () => {
	test("should render desktop menu items from API on desktop viewport", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Verify page loads without errors
		await expect(page).toHaveTitle(/VICAV/);

		// Verify desktop menu (Menubar) is visible on desktop viewport (≥1024px)
		// AI did not get this correct, there are two items with role menubar arias (2nd is the layout switch)
		// and one is always visible.
		await expect(page.locator("(//*[@role='menubar'])[1]/..")).toBeVisible();

		// Verify all menu category items are visible
		await expect(page.getByRole("menuitem", { name: "Project" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Bibliographies" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Profiles" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Feature Lists" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Samples" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Texts" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Dictionaries" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Tools & Technology" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
	});

	test("should hide desktop menu on mobile viewport", async ({ page }) => {
		// Set viewport to mobile size
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Verify desktop menu is NOT visible on mobile viewport (<1024px)
		// AI did not get this correct, there are two items with role menubar arias (2nd is the layout switch)
		// and one is always visible.
		await expect(page.locator("(//*[@role='menubar'])[1]/..")).toBeHidden();
	});

	test("should show mobile menu toggle on small viewport", async ({ page }) => {
		// Set viewport to mobile size
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Verify mobile menu toggle button is visible
		await expect(page.getByRole("button", { name: /Toggle menu/i })).toBeVisible();
	});
});
