import { expect, test } from "@playwright/test";

test.describe("Windows Arrangement", () => {
	test("arrangement options in desktop menu", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Click on "Windows" menu item
		const windowsMenu = page.getByRole("menubar").getByRole("menuitem", { name: "Windows" });
		await windowsMenu.click();

		// Verify arrangement options are visible in the dropdown
		await expect(page.getByRole("menuitem", { name: "None", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Cascade", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Tile", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Smart tile", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Column 5 Flex", exact: true })).toBeVisible();
	});
});
