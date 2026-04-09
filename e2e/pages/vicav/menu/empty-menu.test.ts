import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - Empty Menu Handling", () => {
	test("should handle empty API response gracefully", async ({ page }) => {
		// 1. Mock API to return empty menu array and navigate to homepage
		await page.route("**/api/**", async (route) => {
			// Intercept API call and return empty JSON array
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify([]),
			});
		});

		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");

		// expect: Page should load without errors even if menu API returns empty array
		await expect(page).toHaveTitle(/VICAV/);

		// expect: #window-root never to appear (windows depend on menu data)
		// When menu API returns empty array, windows should not render
		await expect(page.locator("#window-root")).not.toBeInViewport({ timeout: 10000 });

		// 2. Verify menu components are conditionally rendered
		// expect: Main menu items are rendered because of SSR
		// The header and navigation should still be visible
		await expect(page.locator("header")).toBeVisible();

		// Desktop menu should still be in the DOM due to SSR, but not functional
		const menubar = page.locator('[role="menubar"]').first();
		await expect(menubar).toBeVisible();

		// expect: The items are not clickable (dropdowns don't open)
		// Try to click on Project menu - it should not open a dropdown with empty menu data
		const projectMenuItem = page.getByRole("menuitem", { name: "Project" });
		await expect(projectMenuItem).toBeVisible();

		// Click on Project menu - with empty menu data, dropdown should not open properly
		await projectMenuItem.click({ timeout: 5000 });

		// Verify no dropdown menu appears when clicking on menu item (empty menu state)
		// The dropdown should NOT be visible since there's no menu data
		const projectMenu = page.locator('[data-state="open"]').first();
		await expect(projectMenu).toBeHidden({ timeout: 2000 });

		// Verify other menu items are also not functional
		const bibliographiesMenuItem = page.getByRole("menuitem", { name: "Bibliographies" });
		await bibliographiesMenuItem.click({ timeout: 5000 });
		await expect(projectMenu).toBeHidden({ timeout: 2000 });

		// Verify footer is still visible (page structure intact)
		await expect(page.locator("footer")).toBeVisible();

		// Verify main content area is visible
		await expect(page.locator("main")).toBeVisible();
	});
});
