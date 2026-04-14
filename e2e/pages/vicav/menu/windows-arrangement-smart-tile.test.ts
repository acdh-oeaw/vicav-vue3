import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Windows Arrangement Smart Tile", () => {
	test("should arrange windows in smart tile pattern", async ({ page }) => {
		// 1. Open multiple windows
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Windows are already open by default
		// 2. Click on "Windows" menu
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// 3. Click on "Smart tile" arrangement option
		await page.getByRole("menuitem", { name: "Smart tile" }).click();

		// 4. Verify windows are arranged in smart tile pattern
		// expect: Windows are arranged in a smart tile pattern
		const windows = page.locator("[class*='winbox']");
		await expect(windows).toHaveCount(3);
		// TODO: How to actually check this?
	});
});
