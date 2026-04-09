import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Escape", () => {
	test("should close dropdown when Escape is pressed", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on "Project" menu to open dropdown
		await page.getByRole("menuitem", { name: "Project" }).click();

		// Verify dropdown is open
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();

		// 3. Press Escape key
		await page.keyboard.press("Escape");

		// 4. Verify dropdown is closed
		// expect: Dropdown should close when Escape is pressed
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeHidden();
	});
});
