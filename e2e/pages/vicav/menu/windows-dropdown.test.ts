import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Windows Dropdown", () => {
	test("should open Windows menu and display open windows and arrangement options", async ({
		page,
	}) => {
		// 1. Click on "Windows" menu item
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Windows" }).click();

		// 2. Verify dropdown contains open windows:
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "News" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "All Bibl. Locations on Map" })).toBeVisible();

		// Verify arrangement section is visible
		await expect(page.getByRole("menuitem", { name: "None" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Cascade" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Tile" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Smart tile" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Column 5 Flex" })).toBeVisible();

		// expect: Windows menu displays open windows and arrangement options
	});
});
