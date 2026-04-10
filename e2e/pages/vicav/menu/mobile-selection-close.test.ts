import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu - Close on Selection", () => {
	test("should close mobile menu when clicking a menu item", async ({ page }) => {
		// 1. Open mobile menu
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("button", { name: /Toggle menu/i }).click();

		// Verify mobile menu is open
		await expect(page.getByRole("dialog")).toBeVisible();

		// Mobile menu items don't have menuitem role, use getByText within the dialog
		const dialog = page.locator('[role="dialog"]');

		// 2. Click on "Project" menu item to expand it
		await dialog.getByText("Project", { exact: true }).first().click();

		// Click on "Mission" sub-item
		await dialog.getByText("Mission", { exact: true }).first().click();

		// 3. Verify the mobile menu dialog closes
		// expect: Mobile navigation dialog should close after selecting an item
		await expect(page.getByRole("dialog")).toBeHidden();
	});
});
