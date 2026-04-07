import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Close on Outside Click", () => {
	test("should close dropdown when clicking outside the menu", async ({ page }) => {
		// 1. Open any menu dropdown (e.g., Project)
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Project" }).click();

		// Verify dropdown is open
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();

		// 2. Click on the main content area of the page
		await page.locator("#window-root").click({ position: { x: 100, y: 100 } });

		// 3. Verify the dropdown is closed
		// expect: Dropdown menu should close when clicking outside
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeHidden();
	});
});
