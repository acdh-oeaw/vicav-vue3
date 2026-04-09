import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Project Mission", () => {
	test("should open Mission window when clicking Project > Mission", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on "Project" menu
		await page.getByRole("menuitem", { name: "Project" }).click();

		// 3. Click on "Mission" sub-item
		await page.getByRole("menuitem", { name: "Mission" }).click();

		// 4. Verify a window/popup with "Mission" content appears
		// expect: New window opens displaying Mission information
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^Mission$/ })
				.nth(1),
		).toBeVisible();
	});
});
