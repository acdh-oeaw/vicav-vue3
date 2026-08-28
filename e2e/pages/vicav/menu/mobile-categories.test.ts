import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu - All Categories Visible", () => {
	test("should display all 8 categories in mobile menu", async ({ page }) => {
		// 1. Open mobile menu
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("button", { name: /Toggle navigation/i }).click();

		// 2. Verify the following categories are listed:
		const expectedCategories = [
			"Project",
			"Bibliographies",
			"Profiles",
			"Feature Lists",
			"Samples",
			"Texts",
			"Dictionaries",
			"Tools & Technology",
		];

		// Mobile menu items don't have menuitem role, use getByText within the dialog
		const dialog = page.locator('[role="dialog"]');
		for (const category of expectedCategories) {
			await expect(dialog.getByText(category, { exact: true }).first()).toBeVisible();
		}

		// expect: All 8 menu categories are visible in the mobile navigation
	});
});
