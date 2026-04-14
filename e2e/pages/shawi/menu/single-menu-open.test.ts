import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Single Menu Open", () => {
	test("should only open one dropdown at a time", async ({ page }) => {
		// 1. Click on About menu to open it
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Get the menubar and click on About
		const menubar = page.locator("[role='menubar']").first();
		await menubar.getByRole("menuitem", { name: "About" }).click();

		// Verify About dropdown is open - use getByText for submenu items
		await expect(page.getByText("Team")).toBeVisible();

		// 2. Move the mouse to Profiles menu using the same menubar
		await menubar.getByRole("menuitem", { name: "Profiles" }).hover();

		// 3. Verify About menu is closed and Profiles menu is open
		// expect: Only one dropdown menu should be open at a time when clicking different menu items
		// Use getByText for submenu items to avoid strict mode issues
		await expect(page.getByText("Explanation")).toBeVisible();
		await expect(page.getByText("Team")).toBeHidden();

		// 4. Clicking the Profiles menu closes the menu
		await menubar.getByRole("menuitem", { name: "Profiles" }).click();
		await expect(page.getByText("Team")).toBeHidden();
		await expect(page.getByText("Explanation")).toBeHidden();
	});
});
