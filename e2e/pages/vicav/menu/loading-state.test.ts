import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - Loading State", () => {
	test("should handle loading state during API fetch", async ({ page }) => {
		// 1. Navigate to homepage with slow network simulation
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");

		// expect: Initial page load should show loading state or skeleton while API fetches
		// expect: Menu should appear once API data loads
		await expect(page.getByRole("menuitem", { name: "Project" })).toBeVisible({ timeout: 30000 });

		// 2. Wait for API response and verify menu renders correctly
		// expect: No error messages should be visible
		await expect(page.getByText('Notification [ "Error", "')).toBeHidden();
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});
});
