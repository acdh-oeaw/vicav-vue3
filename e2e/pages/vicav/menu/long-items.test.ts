import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - Long Menu Item Names", () => {
	test("should display long menu item names correctly", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Open "Tools & Technology" menu
		await page.getByRole("menuitem", { name: "Tools & Technology" }).click();

		// 3. Verify long items display correctly
		// expect: Long item names are fully visible without truncation issues
		await expect(
			page.getByRole("menuitem", { name: "Textbook Syrian Arabic (Sound files)" }),
		).toBeVisible();
		await expect(
			page.getByRole("menuitem", { name: "Textbook Baghdad Arabic (Sound files)" }),
		).toBeVisible();
		await expect(
			page.getByRole("menuitem", { name: "Textbook Syrian Arabic (Sound files)" }),
		).toHaveText(/Textbook Syrian Arabic/);
	});
});
