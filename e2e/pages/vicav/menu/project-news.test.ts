import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Project News", () => {
	test("should open News window when clicking Project > News", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on "Project" menu
		await page.getByRole("menuitem", { name: "Project" }).click();

		// 3. Click on "News" sub-item
		await page.getByRole("menuitem", { name: "News" }).click();

		// 4. Verify a window/popup with "News" content appears
		// expect: New window opens displaying News content
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^News$/ })
				.nth(1),
		).toBeVisible();
	});
});
