import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu Rendering", () => {
	test("should display all five desktop menu items", async ({ page }) => {
		// 1. Navigate to home page and verify menu bar contains About, Profiles, Corpus, Glossary, Windows menu items
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: All five menu items should be visible: About, Profiles, Corpus, Glossary, Windows
		await expect(page.getByRole("menuitem", { name: "About" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Profiles" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Corpus" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Glossary" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();

		// Verify exactly 5 menu items
		const menuItems = page.locator("[role='menubar'] >> role=menuitem");
		await expect(menuItems).toHaveCount(5);
	});
});
