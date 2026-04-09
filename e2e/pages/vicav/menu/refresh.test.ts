import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - Page Refresh", () => {
	test("should work correctly after page refresh", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Interact with menus (open dropdowns, select items)
		await page.getByRole("menuitem", { name: "Project" }).click();
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();

		// 3. Refresh the page
		await page.reload();
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 4. Verify menus still work correctly
		// expect: Menu functionality is restored after refresh
		await page.getByRole("menuitem", { name: "Project" }).click();
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
	});
});
