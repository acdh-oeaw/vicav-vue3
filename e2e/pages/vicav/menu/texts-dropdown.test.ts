import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Texts Dropdown", () => {
	test("should open Texts menu and display the single item", async ({ page }) => {
		// 1. Click on "Texts" trigger
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Texts", exact: true })
			.click();

		// Get reference to the dropdown content
		const dropdown = page.locator("[data-slot=navigation-menu-content]");
		await expect(dropdown).toBeVisible();

		// 2. Verify dropdown contains:
		await expect(dropdown.getByRole("button", { name: "Explanation and Overview" })).toBeVisible();

		// expect: Single menu item is visible
		const dropdownItems = dropdown.locator("[data-slot=navigation-menu-link]");
		await expect(dropdownItems).toHaveCount(1);
	});
});
