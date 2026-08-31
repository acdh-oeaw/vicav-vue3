import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu Rendering", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("should display all five desktop menu items", async ({ page }) => {
		// expect: All five menu items should be visible: About, Profiles, Corpus, Dictionary, Windows
		await expect(page.getByRole("button", { name: "About" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Corpus" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Dictionary" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();

		// Verify exactly 5 menu items
		const menuItems = page.locator("[data-slot=navigation-menu-list] >> button");
		await expect(menuItems).toHaveCount(4); // Windows menu is separate.
	});
});
