import { expect, test } from "@playwright/test";

test.describe("map page", () => {
	test("should have map bar with appropriate selection", async ({ page }) => {
		await page.goto("/?w=W10=&a=smart-tile");
		await page.getByRole("menuitem", { name: "Bibliographies" }).click();
		await page.getByRole("menuitem", { name: "All Bibl. Locations on Map" }).click();
		await expect(page.getByRole("button", { name: "Bibl. Locations" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Bibl. Locations" })).toContainClass(
			"data-selected:bg-accent",
		);
	});

	test("should show map with markers in viewport", async ({ page }) => {
		await page.goto("/?w=W10=&a=smart-tile");
		await page.getByRole("menuitem", { name: "Bibliographies" }).click();
		await page.getByRole("menuitem", { name: "All Bibl. Locations on Map" }).click();
		await expect(page.locator(".leaflet-control-container")).toBeVisible();
		await expect(page.locator("img:nth-child(218)")).toBeVisible();
	});
});
