import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle("Home | SHAWI");
	});

	// We have not decided what initial windows should be visible
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip("should show initial windows", async ({ page }) => {
		await page.goto("/");
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^Mission$/ })
				.nth(1),
		).toBeVisible();
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^News$/ })
				.nth(1),
		).toBeVisible();
	});

	// We have not decided what initial windows should be visible
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip("should open window menu with appropriate entries", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
		await page.getByRole("menuitem", { name: "Windows" }).click();
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "News" })).toBeVisible();
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
			.filter({ hasText: "© 2025 ACDH-CH |Imprint|" })
			.locator("div")
			.first()
			.hover();
		await expect(page.getByText("CONTACT")).toBeVisible();
	});
});
