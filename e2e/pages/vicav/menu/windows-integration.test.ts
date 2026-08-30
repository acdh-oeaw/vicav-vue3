import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Windows Integration", () => {
	test("should show open windows in Windows dropdown", async ({ page }) => {
		// 1. Navigate to homepage at 1280x720
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with desktop menu visible
		// 2. Click on Windows dropdown in menubar
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// expect: Windows dropdown should show initial windows (Mission, News, All Bibl. Locations on Map)
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "News" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "All Bibl. Locations on Map" })).toBeVisible();

		// 3. Open a menu item to create a window, then verify it appears in Windows dropdown
		// Close Windows dropdown first
		await page.keyboard.press("Escape");
		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Project", exact: true })
			.click();
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();
		await content.getByRole("button", { name: "Types of Text/Data" }).click();

		// Open Windows dropdown again
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// expect: Windows dropdown should list all open windows with their titles
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "News" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "All Bibl. Locations on Map" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Types of Text" })).toBeVisible();

		// 4. Clicking on a window in the dropdown should focus/restore that window
		await page.getByRole("menuitem", { name: "Cascade" }).click();
		await page.getByRole("menuitem", { name: "Windows" }).click();
		await page.getByRole("menuitem", { name: "Mission" }).click();

		// expect: The Mission window should now be focused (check for focus class on the window)
		await expect(page.locator(".winbox.focus .wb-title", { hasText: "Mission" })).toBeVisible();
	});
});
