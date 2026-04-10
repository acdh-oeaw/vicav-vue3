import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Close on Outside Click", () => {
	test("should close dropdown when clicking outside the menu", async ({ page }) => {
		// 1. Open any menu (e.g., About)
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "About" }).click();

		// Verify dropdown is open
		await expect(page.getByRole("menuitem", { name: "Team" })).toBeVisible();

		// 2. Click on the main content area
		// Use force: true because #window-root has pointer-events-none
		await page.locator("#window-root").click({ position: { x: 100, y: 100 }, force: true });

		// 3. Verify the menu is closed
		// expect: Menu should close when clicking on main content area outside the menu
		await expect(page.getByRole("menuitem", { name: "Team" })).toBeHidden();
	});
});
