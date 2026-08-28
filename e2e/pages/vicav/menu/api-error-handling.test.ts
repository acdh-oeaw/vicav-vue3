import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - API Error Handling", () => {
	test("should handle API errors gracefully", async ({ page }) => {
		// 1. Mock API to return error and navigate to homepage.
		// Aborting the Nuxt assets as well prevents client-side hydration,
		// so the page is served purely from the SSR HTML.
		await page.route("**/vicav/**", async (route) => {
			// Abort the request to simulate network/API error
			await route.abort("failed");
		});
		await page.route("**/_nuxt/**", async (route) => {
			// Abort the request to simulate network/API error
			await route.abort("failed");
		});

		await page.setViewportSize({ width: 1920, height: 1080 });
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

		// expect: Main menu items are rendered (from the SSR HTML)
		const project = page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Project", exact: true });
		await expect(project).toBeVisible();

		// expect: The items are not clickable (no client-side hydration)
		await project.click();
		await expect(page.locator("[data-slot=navigation-menu-content]")).not.toBeAttached();
	});
});
