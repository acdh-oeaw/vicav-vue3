import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Project Mission", () => {
	test("should open Mission window when clicking Project > Mission", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on "Project" trigger
		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Project", exact: true })
			.click();
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

		// 3. Click on "Mission" sub-item
		await content.getByRole("button", { name: "Mission" }).click();

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
