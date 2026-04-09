import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Single Menu Open", () => {
	test("should only open one dropdown at a time", async ({ page }) => {
		// 1. Open the "Project" menu
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Project" }).click();

		// Verify Project dropdown is open
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();

		// 2. Click on "Bibliographies" menu
		await page.getByRole("menuitem", { name: "Bibliographies" }).click();

		// 3. Verify that Project menu is closed and Bibliographies is open
		// expect: Only one dropdown should be open at a time
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeHidden();
		await expect(page.getByRole("menuitem", { name: "Explanation" })).toBeVisible();
	});
});
