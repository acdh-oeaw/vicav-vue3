import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Separators - Desktop", () => {
	test("should render separators correctly in desktop menu", async ({ page }) => {
		// 1. Navigate to homepage at 1280x720
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// expect: Page should load with desktop menu visible
		// 2. Open a menu dropdown that contains separators (e.g., Dictionaries)
		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Dictionaries", exact: true })
			.click();
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

		// expect: Menu items with type='separator' should render as visual separators
		// (plain divs with a data-slot attribute, no ARIA role)
		const separators = content.locator("[data-slot=navigation-menu-separator]");
		await expect(separators.first()).toBeVisible();
		await expect(separators.first()).toHaveAttribute("data-slot", "navigation-menu-separator");
	});
});
