import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Accessibility - Desktop Menu", () => {
	test("should have proper ARIA attributes for desktop menu", async ({ page }) => {
		// 1. Navigate to homepage at 1280x720
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with desktop menu visible
		// 2. Check accessibility tree for proper ARIA roles
		// expect: Menu should have proper role attributes (role="menubar")
		await expect(page.locator("[role='menubar']").first()).toHaveAttribute("role", "menubar");
		// expect: Menu items should have role="menuitem"
		await expect(page.getByRole("menuitem", { name: "Project" })).toHaveAttribute(
			"role",
			"menuitem",
		);
		// expect: Menu triggers should be focusable
		await page.getByRole("menuitem", { name: "Project" }).focus();
		await expect(page.getByRole("menuitem", { name: "Project" })).toBeFocused();
	});
});
