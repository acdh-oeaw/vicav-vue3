import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Separators - Desktop", () => {
	test("should render separators correctly in desktop menu", async ({ page }) => {
		// 1. Navigate to homepage at 1280x720
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with desktop menu visible
		// 2. Open a menu dropdown that contains separators (e.g., Dictionaries)
		await page.getByRole("menuitem", { name: "Dictionaries" }).click();

		// expect: Menu items with type='separator' should render as visual separators
		await expect(page.locator("[role='separator']").first()).toBeVisible();
		// expect: Separators should have role='separator' for accessibility
		await expect(page.locator("[role='separator']").first()).toHaveAttribute("role", "separator");
	});
});
