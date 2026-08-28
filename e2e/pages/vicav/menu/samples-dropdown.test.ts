import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Samples Dropdown", () => {
	test("should open Samples menu and display all 3 items", async ({ page }) => {
		// 1. Click on "Samples" trigger
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Samples", exact: true })
			.click();

		// Get reference to the dropdown content
		const dropdown = page.locator("[data-slot=navigation-menu-content]");
		await expect(dropdown).toBeVisible();

		// 2. Verify dropdown contains:
		const expectedItems = ["Explanation", "Show All Samples on Map", "Contribute a Sample Text"];

		for (const item of expectedItems) {
			await expect(dropdown.getByRole("button", { name: item })).toBeVisible();
		}

		// expect: All 3 menu items are visible and clickable
		const dropdownItems = dropdown.locator("[data-slot=navigation-menu-link]");
		await expect(dropdownItems).toHaveCount(3);
	});
});
