import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Menu Item - Project News", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// close initial windows
		await page.locator(".wb-close").first().click();
		await page.locator(".wb-close").first().click();
		await page.locator(".wb-close").first().click();
	});

	test("should open News window when clicking Project > News", async ({ page }) => {
		// 1. Click on "Project" trigger
		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Project", exact: true })
			.click();
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

		// 2. Click on "News" sub-item
		await content.getByRole("button", { name: "News" }).click();

		// 3. Verify a window/popup with "News" content appears
		// expect: New window opens displaying News content
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^VICAV News$/ })
				.nth(1),
		).toBeVisible();
	});
});
