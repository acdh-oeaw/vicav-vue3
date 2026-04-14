import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Enter", () => {
	test("should open dropdown when Enter is pressed", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/?w=W10=&a=smart-tile");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Press Tab to navigate to the menubar - this should focus the first menu item
		// Tab sequence: skip link -> menubar -> first menuitem (Project)
		await page.keyboard.press("Tab"); // Skip to main content link
		await page.keyboard.press("Tab"); // Menubar container
		await page.keyboard.press("Tab"); // First menuitem (Project)
		await expect(page.getByRole("menuitem", { name: "Project" })).toBeFocused();

		// 3. Press Enter
		await page.keyboard.press("Enter");

		// 4. Verify Project dropdown opens
		// expect: Dropdown menu should open when Enter is pressed
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
	});
});
