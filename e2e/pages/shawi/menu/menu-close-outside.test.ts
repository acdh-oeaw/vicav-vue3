import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Close on Outside Click", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// close initial About window
		await page.locator(".wb-close").first().click();
	});

	test("should close dropdown when clicking outside the menu", async ({ page }) => {
		await page.getByRole("button", { name: "About" }).click();

		// Verify dropdown is open
		await expect(page.getByRole("button", { name: "Team" })).toBeVisible();

		// 2. Click on the main content area
		// Use force: true because #window-root has pointer-events-none
		await page.locator("#window-root").click({ position: { x: 100, y: 100 }, force: true });

		// 3. Verify the menu is closed
		// expect: Menu should close when clicking on main content area outside the menu
		await expect(page.getByRole("button", { name: "Team" })).toBeHidden();
	});
});
