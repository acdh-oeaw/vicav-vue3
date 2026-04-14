import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		await expect(page).toHaveTitle("Home | SHAWI");
	});

	// We have not decided what initial windows should be visible
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip("should show initial windows", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// TODO: extend when there are any initial windows
	});

	// We have not decided what initial windows should be visible
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip("should open window menu with appropriate entries", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// TODO: extend when there are any initial windows
	});

	test("should show footer bar with imprint link", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("link", { name: "Imprint" })).toBeVisible();
	});

	test("should open extended footer", async ({ page }) => {
		await page.goto("/");
		await page
			.getByRole("contentinfo")
			.locator("div")
			.filter({ hasText: "© 2026 ACDH |Imprint|" })
			.locator("div")
			.first()
			.hover();
		await expect(page.getByText("CONTACT")).toBeVisible();
	});
});
