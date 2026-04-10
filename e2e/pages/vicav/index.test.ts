import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
	});

	test("should show initial windows", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
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
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^All Bibl\. Locations on Map$/ })
				.nth(1),
		).toBeVisible();
	});

	test("should open window menu with appropriate entries", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
		await page.getByRole("menuitem", { name: "Windows" }).click();
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "News" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "All Bibl. Locations on Map" })).toBeVisible();
	});

	test("should show footer bar with imprint link", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		await expect(page.getByRole("link", { name: "Imprint" })).toBeVisible();
	});

	test("should open extended footer", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
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
