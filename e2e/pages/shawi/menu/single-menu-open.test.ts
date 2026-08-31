import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Single Menu Open", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// close initial About window
		await page.locator(".wb-close").first().click();
	});

	test("should only open one dropdown at a time", async ({ page }) => {
		// Get the menubar and click on About
		const menubar = page.locator("[data-slot=navigation-menu-list]");
		await menubar.getByRole("button", { name: "About" }).click();

		// Verify About dropdown is open - use getByText for submenu items
		await expect(page.getByText("Team")).toBeVisible();

		// 2. Move the mouse to Profiles menu using the same menubar
		await menubar.getByRole("button", { name: "Places" }).hover();
		await expect(page.getByText("Team")).toBeHidden();
		await expect(page.getByText("The Shawi Project")).toBeHidden();

		// 3. Verify About menu is closed and Profiles menu is open
		// expect: Only one dropdown menu should be open at a time when clicking different menu items
		// Use getByText for submenu items to avoid strict mode issues
		await menubar.getByRole("button", { name: "About" }).hover();
		await expect(page.getByText("The Shawi Project")).toBeVisible();
		await expect(page.getByText("Team")).toBeVisible();

		// 4. Clicking the Profiles menu closes the menu
		await menubar.getByRole("button", { name: "Places" }).click();
		await expect(page.getByText("Team")).toBeHidden();
		await expect(page.getByText("The Shawi Project")).toBeHidden();
	});
});
