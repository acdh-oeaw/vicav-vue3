import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu - Toggle Button Visibility", () => {
	test("should show toggle button on viewport below 1024px", async ({ page }) => {
		// 1. Set viewport to 480x800 (mobile)
		await page.setViewportSize({ width: 480, height: 800 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Navigate to the homepage
		// 3. Locate the "Toggle navigation" button
		// expect: Toggle navigation button should be visible in the navigation area
		await expect(page.getByRole("button", { name: /Toggle navigation/i })).toBeVisible();
	});
});
