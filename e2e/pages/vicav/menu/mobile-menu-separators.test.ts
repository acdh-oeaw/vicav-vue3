import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Separators - Mobile", () => {
	test("should render separators correctly in mobile menu", async ({ page }) => {
		// 1. Navigate to homepage at 375x667
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with mobile menu visible
		// 2. Open mobile menu and expand a category with separators
		await page.getByRole("button", { name: /Toggle navigation/i }).click();
		// Mobile menu items don't have menuitem role, use getByText within the dialog
		const dialog = page.locator('[role="dialog"]');
		await dialog.getByText("Dictionaries", { exact: true }).first().click();

		// Wait a moment for the animation to complete
		await page.waitForTimeout(500);

		// expect: Menu items with type='separator' should render as visual separators
		// (plain divs with a data-slot attribute, no ARIA role)
		// Check that there's at least one visible separator in the dialog
		const separators = dialog.locator("[data-slot=navigation-menu-separator]");
		const count = await separators.count();
		expect(count).toBeGreaterThan(0);

		// Verify at least one separator is visible
		let hasVisibleSeparator = false;
		for (let i = 0; i < count; i++) {
			if (await separators.nth(i).isVisible()) {
				hasVisibleSeparator = true;
				break;
			}
		}
		expect(hasVisibleSeparator).toBe(true);

		// expect: Separators should be visible as horizontal lines between menu items
		await expect(separators.first()).toHaveAttribute("data-slot", "navigation-menu-separator");
	});
});
