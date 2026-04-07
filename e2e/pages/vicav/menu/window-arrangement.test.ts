import { expect, test } from "@playwright/test";

test.describe("Windows Arrangement", () => {
	test("arrangement options in desktop menu", async ({ page }) => {
		await page.goto("http://localhost:3000");
		await page.setViewportSize({ width: 1280, height: 720 });

		await expect(page).toHaveTitle(/VICAV/);

		const windowsMenu = page.getByRole("menubar").getByRole("menuitem", { name: "Windows" });
		await windowsMenu.click();

		const dropdown = page.getByRole("menu", { name: "Windows" });
		await expect(dropdown).toBeVisible();

		const arrangementSection = page.getByRole("menuitem", { name: /Arrange/i });
		await expect(arrangementSection).toBeVisible();
	});
});
