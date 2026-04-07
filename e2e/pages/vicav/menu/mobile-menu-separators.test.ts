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
		await page.getByRole("button", { name: /Toggle menu/i }).click();
		await page.getByRole("menuitem", { name: "Dictionaries" }).click();

		// expect: Menu items with type='separator' should render as visual separators
		await expect(page.locator("[role='separator']")).toBeVisible();
		// expect: Separators should be visible as horizontal lines between menu items
		await expect(page.locator("[role='separator']").first()).toHaveAttribute("role", "separator");
	});
});
