import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - API Error Handling", () => {
	test("should handle API errors gracefully", async ({ page }) => {
		// 1. Mock API to return error and navigate to homepage
		await page.route("**/vicav/**", async (route) => {
			// Abort the request to simulate network/API error
			await route.abort("failed");
		});
		await page.route("**/_nuxt/**", async (route) => {
			// Abort the request to simulate network/API error
			await route.abort("failed");
		});

		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");

		// expect: Page should load even if API request fails
		await expect(page).toHaveTitle(/VICAV/);

		// expect: #window-root never to appear (windows depend on menu data)
		// This is expected behavior - when API fails, windows don't render
		await expect(page.locator("#window-root")).not.toBeInViewport({ timeout: 10000 });

		// 2. Verify page still displays header, footer, and other content
		// expect: Header should be visible
		await expect(page.locator("header")).toBeVisible();

		// expect: Footer should be visible
		await expect(page.locator("footer")).toBeVisible();

		// expect: Page should remain functional with other elements
		// The main content area should still be present
		await expect(page.locator("main")).toBeVisible();

		// expect: Main menu items are rendered (but not clickable)
		// Desktop menu may still render but should not be functional
		const projectMenuItem = page.getByRole("menuitem", { name: "Project" });

		// Menu items may render but should not be interactive when API fails
		// Try to click on Project menu - it should not open a dropdown
		await projectMenuItem.click({ timeout: 5000 });

		// Verify no dropdown menu appears when clicking on menu item (API error state)
		// The dropdown should NOT be visible since API failed
		const projectMenu = page.locator('[data-state="open"]').first();
		await expect(projectMenu).toBeHidden({ timeout: 2000 });
	});
});
