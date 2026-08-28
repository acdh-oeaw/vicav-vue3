import { expect, test } from "@playwright/test";

test.describe("Mobile Responsive", () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("TC-032: Mobile Viewport", async ({ page }) => {
		const viewport = page.viewportSize();
		expect(viewport?.width).toBe(375);
		expect(viewport?.height).toBe(667);
		await expect(page.locator("header")).toBeVisible();
	});

	test("TC-033: Mobile Navigation Available", async ({ page }) => {
		await expect(page.locator("header")).toBeVisible();
		await expect(page.getByRole("menubar")).toBeVisible();
	});
});
