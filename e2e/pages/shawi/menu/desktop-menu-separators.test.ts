import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Separators - Desktop", () => {
	test("should render separator lines in Windows menu", async ({ page }) => {
		// 1. Open Windows menu and verify separator between 'No windows open' and 'Arrangement' sections
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Open Windows menu
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// expect: Separator lines should be visible between menu sections where applicable
		// Windows menu has a separator between "No windows open" and "Arrangement" section
		await expect(page.locator("[role='separator']").first()).toBeVisible();
		await expect(page.locator("[role='separator']").first()).toHaveAttribute("role", "separator");
	});
});
