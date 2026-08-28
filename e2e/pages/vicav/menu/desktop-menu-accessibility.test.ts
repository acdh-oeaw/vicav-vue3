import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Accessibility - Desktop Menu", () => {
	test("should have proper ARIA attributes for desktop menu", async ({ page }) => {
		// 1. Navigate to homepage at 1280x720
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with desktop menu visible
		// 2. Check accessibility tree for proper roles.
		// The main menu uses NavigationMenu (disclosure pattern): triggers and items
		// are buttons, no menubar/menu roles.
		await expect(page.locator("[data-slot=navigation-menu]")).toBeVisible();
		await expect(page.locator("[role=menubar][data-slot=navigation-menu]")).toHaveCount(0);

		// expect: The Windows dropdown still uses Menubar (role="menubar", role="menuitem")
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();

		// expect: Triggers are buttons with aria-expanded, initially closed
		// (scoped to the menu list to avoid same-named buttons elsewhere)
		const project = page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Project", exact: true });
		await expect(project).toHaveAttribute("aria-expanded", "false");

		// expect: Menu triggers should be focusable
		await project.focus();
		await expect(project).toBeFocused();
	});
});
