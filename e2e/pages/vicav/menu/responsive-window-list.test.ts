import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Responsive Behavior - Window List", () => {
	test("should show Windows dropdown in both desktop and mobile views", async ({ page }) => {
		// 1. Navigate to homepage at 1280x720
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load on desktop viewport
		// 2. Locate and verify Windows dropdown in desktop menu
		// expect: Windows dropdown should be visible in desktop menu bar
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
		// expect: Windows dropdown should show window count when windows are open
		await page.getByRole("menuitem", { name: "Windows" }).click();
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();

		// Close the dropdown
		await page.keyboard.press("Escape");

		// 3. Resize to mobile viewport and verify Windows dropdown in mobile menu
		await page.setViewportSize({ width: 375, height: 667 });
		// expect: Windows dropdown should be visible in mobile menu
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
		// expect: Windows dropdown should show window count
		await page.getByRole("menuitem", { name: "Windows" }).click();
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();

		// 4. Open the mobile menu and verify the accordion is rendered
		await page.getByRole("button", { name: /Toggle navigation/i }).click();
		await expect(page.locator('[role="dialog"] nav[aria-label="Main navigation"]')).toBeVisible();
	});
});
