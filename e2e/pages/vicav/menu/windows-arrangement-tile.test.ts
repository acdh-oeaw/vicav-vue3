import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Windows Arrangement Tile", () => {
	test("should arrange windows in tile pattern", async ({ page }) => {
		// 1. Open multiple windows
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Windows are already open by default
		// 2. Click on "Windows" menu
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// 3. Click on "Tile" arrangement option
		await page.getByRole("menuitem", { name: "Tile", exact: true }).click();

		// 4. Verify windows are arranged in tile pattern
		// expect: Windows are visually tiled on the page
		const windows = page.locator("[class*='winbox']");
		await expect(windows).toHaveCount(3);
		// TODO: How to actually check this?
	});
});
