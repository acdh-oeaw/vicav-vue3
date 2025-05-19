/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
import { expect, test } from "@playwright/test";

test.describe("map page", () => {
	test("should have map bar with appropriate selection", async ({ page }) => {
		await page.goto("/?w=W10=&a=smart-tile");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await page.getByRole("menuitem", { name: "Bibliographies" }).click();
				await page.getByRole("menuitem", { name: "All Bibl. Locations on Map" }).click();
				await expect(page.getByRole("button", { name: "Bibl. Locations" })).toBeVisible();
				await expect(page.getByRole("button", { name: "Bibl. Locations" })).toContainClass(
					"data-selected:bg-accent",
				);
				break;
		}
	});
	test("should show map with markers in viewport", async ({ page }) => {
		await page.goto("/?w=W10=&a=smart-tile");
		switch (process.env.NUXT_PUBLIC_API_BASE_URL) {
			case "https://vicav-dev.acdh.oeaw.ac.at":
				await page.getByRole("menuitem", { name: "Bibliographies" }).click();
				await page.getByRole("menuitem", { name: "All Bibl. Locations on Map" }).click();
				await expect(page.locator(".leaflet-control-container")).toBeVisible();
				await expect(page.locator("img:nth-child(1)")).toBeVisible();
				break;
		}
	});
});
