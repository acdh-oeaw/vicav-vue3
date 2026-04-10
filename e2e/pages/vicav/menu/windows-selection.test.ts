import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Windows Selection", () => {
	test("should focus window when clicking Windows menu item", async ({ page }) => {
		// 1. First, open Mission and News windows (via Project menu)
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Mission and News windows are already open by default
		// 2. Click on "Windows" menu
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// 3. Click on "News" in the Windows dropdown
		await page.getByRole("menuitem", { name: "News" }).click();

		// 4. The Mission window should now be focused (check for focus class on the window)
		await expect(page.locator(".winbox.focus .wb-title", { hasText: "News" })).toBeVisible();
	});
});
