import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - Long Menu Item Names", () => {
	test("should display long menu item names correctly", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Open "Tools & Technology" menu
		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Tools & Technology", exact: true })
			.click();
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

		// 3. Verify long items display correctly
		// expect: Long item names are fully visible without truncation issues
		await expect(
			content.getByRole("button", { name: "Textbook Syrian Arabic (Sound files)" }),
		).toBeVisible();
		await expect(
			content.getByRole("button", { name: "Textbook Baghdad Arabic (Sound files)" }),
		).toBeVisible();
		await expect(
			content.getByRole("button", { name: "Textbook Syrian Arabic (Sound files)" }),
		).toHaveText(/Textbook Syrian Arabic/);
	});
});
