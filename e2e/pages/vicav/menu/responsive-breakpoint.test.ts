import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Responsive Behavior - Breakpoint", () => {
	test("should switch between desktop and mobile at 1024px breakpoint", async ({ page }) => {
		// 1. Navigate to homepage and set viewport to 1024x768
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with desktop menu visible at 1024px width
		// 2. Verify visible elements at 1024px width
		// expect: Desktop menu (Menubar) should be visible
		await expect(page.locator("(//*[@role='menubar'])[1]/..")).toBeVisible();
		// expect: Mobile menu toggle should NOT be visible
		await expect(page.getByRole("button", { name: /Toggle menu/i })).toBeHidden();

		// 3. Resize viewport to 1280x720 and verify desktop menu
		await page.setViewportSize({ width: 1280, height: 720 });
		// expect: Desktop menu should remain visible at widths > 1024px
		await expect(page.locator("(//*[@role='menubar'])[1]/..")).toBeVisible();

		// 4. Resize viewport to 1023x768
		await page.setViewportSize({ width: 1023, height: 768 });
		// expect: At 1023px width, mobile menu should appear and desktop menu should hide
		await expect(page.locator("(//*[@role='menubar'])[1]/..")).toBeHidden();

		// 5. Verify mobile menu is shown at < 1024px
		// expect: At 1023px width, mobile menu toggle should be visible
		await expect(page.getByRole("button", { name: /Toggle menu/i })).toBeVisible();
		// expect: Desktop menu should NOT be visible
		await expect(page.locator("(//*[@role='menubar'])[1]/..")).toBeHidden();
	});
});
