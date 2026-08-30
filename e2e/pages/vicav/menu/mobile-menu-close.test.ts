import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu - Close on Button", () => {
	test("should close mobile menu when close button is clicked", async ({ page }) => {
		// 1. Open mobile menu
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("button", { name: /Toggle navigation/i }).click();

		// Verify mobile menu is open
		await expect(page.getByRole("dialog")).toBeVisible();

		// 2. Click the close button (X icon)
		await page.getByRole("button", { name: /Close/i }).click();

		// 3. Verify the mobile menu dialog is closed
		// expect: Mobile navigation dialog should close
		await expect(page.getByRole("dialog")).toBeHidden();
	});
});
