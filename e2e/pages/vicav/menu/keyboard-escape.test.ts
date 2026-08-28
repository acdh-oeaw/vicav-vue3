import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Escape", () => {
	test("should close dropdown when Escape is pressed", async ({ page }) => {
		// 1. Open "Project" menu to open dropdown
		// Note: Playwright's click dispatches a pointermove before the click, so
		// reka-ui opens the menu through its hover logic (short delay) rather than
		// the click itself. Wait for the content to be visible first.
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Scope trigger lookups to the menu list to avoid same-named buttons elsewhere
		// (e.g. map window layer buttons).
		const project = page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Project", exact: true });
		await project.click();
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

		// 2. Press Escape key
		await page.keyboard.press("Escape");

		// 3. Verify dropdown is closed and focus returns to the trigger
		// expect: Dropdown should close when Escape is pressed
		await expect(content).toBeHidden();
		await expect(project).toBeFocused();
	});
});
