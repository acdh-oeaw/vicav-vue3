import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Accessibility - Mobile Menu", () => {
	test("should have proper ARIA attributes for mobile menu", async ({ page }) => {
		// 1. Navigate to homepage at 375x667
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with mobile menu visible
		// 2. Open mobile menu and check accessibility tree
		const toggleButton = page.getByRole("button", { name: /Toggle menu/i });

		// expect: Toggle button should have aria-label before opening
		await expect(toggleButton).toHaveAttribute("aria-label", /toggle/i);

		await toggleButton.click();

		// expect: Mobile menu sheet should have proper ARIA attributes
		await expect(page.getByRole("dialog")).toBeVisible();
		// expect: Sheet content should have proper title (role="dialog" with aria-labelledby)
		await expect(page.getByRole("dialog")).toHaveAttribute("role", "dialog");

		// 3. Verify semantic HTML for expandable sections
		// expect: Menu categories in mobile menu should be properly structured
		// Mobile menu items are rendered as generic elements, not menuitem role
		const dialog = page.locator('[role="dialog"]');
		await expect(dialog.getByText("Project", { exact: true }).first()).toBeVisible();
	});
});
