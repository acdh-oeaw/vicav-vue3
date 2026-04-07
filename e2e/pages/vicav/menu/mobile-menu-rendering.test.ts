import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu Rendering", () => {
	test("should render mobile menu items from API on mobile viewport", async ({ page }) => {
		// 1. Navigate to homepage at http://localhost:3000 on mobile viewport (375x667)
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load without errors
		await expect(page).toHaveTitle(/VICAV/);

		// expect: Header should be visible
		await expect(page.locator("header")).toBeVisible();

		// 2. Click the mobile menu toggle button
		await page.getByRole("button", { name: /Toggle menu/i }).click();

		// expect: Mobile menu sheet should open when toggle button is clicked
		await expect(page.getByRole("dialog")).toBeVisible();

		// expect: Mobile menu should display all menu categories with their items
		await expect(page.getByRole("menuitem", { name: "Project" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Bibliographies" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Profiles" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Feature Lists" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Samples" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Texts" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Dictionaries" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Tools & Technology" })).toBeVisible();

		// 3. Click outside the mobile menu sheet to close it
		await page.locator("#window-root").click({ position: { x: -50, y: -50 } });

		// expect: Mobile menu should close when clicking outside or on a menu item
		await expect(page.getByRole("dialog")).toBeHidden();
	});
});
