/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
				break;
			case "https://wibarab-api.acdh-ch-dev.oeaw.ac.at":
				await expect(page).toHaveTitle("Home | WIBARAB");
				break;
			case "https://tunocent-22a417b1-9f07-406b-9098-288b3f981d99.acdh-ch-dev.oeaw.ac.at":
				await expect(page).toHaveTitle("Home | TUNOCENT");
				break;
			default:
				await expect(page).toHaveTitle("Home | VICAV3.0 - Vienna Corpus of Arabic Varieties");
		}
	});
	test("should show initial windows", async ({ page }) => {
		await page.goto("/");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
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
				break;
		}
	});
	test("should open window menu with appropriate entries", async ({ page }) => {
		await page.goto("/");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await expect(page.getByRole("menuitem", { name: "Windows" })).toBeVisible();
				await page.getByRole("menuitem", { name: "Windows" }).click();
				await expect(page.getByRole("menuitem", { name: "Mission" })).toBeVisible();
				await expect(page.getByRole("menuitem", { name: "News" })).toBeVisible();
				await expect(
					page.getByRole("menuitem", { name: "All Bibl. Locations on Map" }),
				).toBeVisible();
				break;
		}
	});
	test("should show footer bar with imprint link", async ({ page }) => {
		await page.goto("/");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await expect(page.getByRole("link", { name: "Imprint" })).toBeVisible();
				break;
		}
	});
	test("should open extended footer", async ({ page }) => {
		await page.goto("/");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await page
					.getByRole("contentinfo")
					.locator("div")
					.filter({ hasText: "© 2025 ACDH-CH |Imprint|" })
					.locator("div")
					.first()
					.hover();
				await expect(page.getByText("CONTACT")).toBeVisible();
				break;
		}
	});
});
