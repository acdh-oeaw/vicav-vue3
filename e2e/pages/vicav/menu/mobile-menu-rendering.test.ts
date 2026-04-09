import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu Rendering", () => {
	test("should render mobile menu items from API on mobile viewport", async ({ page }) => {
		// 1. Navigate to homepage at http://localhost:3000 on mobile viewport (375x667)
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load without errors
		await expect(page).toHaveTitle(/VICAV/);

		// expect: Header should be visible
		await expect(page.locator("header")).toBeVisible();

		// 2. Click the mobile menu toggle button
		await page.getByRole("button", { name: /Toggle menu/i }).click();

		// expect: Mobile menu sheet should open when toggle button is clicked
		await expect(page.getByRole("dialog")).toBeVisible();

		// expect: Mobile menu should display all menu categories with their items
		// Using getByText within the dialog since the menu items don't have menuitem role
		const dialog = page.locator('[role="dialog"]');
		// Use getByText with exact match and first() to get the menu item (not summary elements)
		// The menu items appear as the first matching text in each group
		await expect(dialog.getByText("Project", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Bibliographies", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Profiles", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Feature Lists", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Samples", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Texts", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Dictionaries", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Tools & Technology", { exact: true }).first()).toBeVisible();

		// 3. Close the mobile menu using Escape key or close button
		// The #window-root has pointer-events-none so we use keyboard or close button
		await page.keyboard.press("Escape");

		// expect: Mobile menu should close when clicking outside or on a menu item
		await expect(page.getByRole("dialog")).toBeHidden();
	});
});
