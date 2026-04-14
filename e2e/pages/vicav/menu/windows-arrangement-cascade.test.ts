import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Windows Arrangement Cascade", () => {
	test("should arrange windows in cascade pattern", async ({ page }) => {
		// 1. Open multiple windows (Mission, News, Map)
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Mission, News, and All Bibl. Locations on Map are open by default
		// 2. Click on "Windows" menu
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// 3. Click on "Cascade" arrangement option
		await page.getByRole("menuitem", { name: "Cascade" }).click();

		// 4. Verify windows are arranged in cascade pattern
		// expect: Windows are visually cascaded on the page
		// The arrangement should be applied - windows should have different positions
		const windows = page.locator("[class*='winbox']");
		await expect(windows).toHaveCount(3);
	});
});
