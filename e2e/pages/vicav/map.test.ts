import { expect, test } from "@playwright/test";

test.describe("map page", () => {
	test("should have map bar with appropriate selection", async ({ page }) => {
		await page.goto("/?w=W10=&a=smart-tile");
		// Wait for hydration (clicking before client-side hydration is a no-op)
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		await page.getByRole("navigation").getByRole("button", { name: "Bibliographies" }).click();
		await page
			.locator("[data-slot=navigation-menu-content]")
			.getByText("All Bibl. Locations on Map")
			.click();
		// exact: the (still open) Bibliographies dropdown contains the menu item
		// "All Bibl. Locations on Map", which substring-matches "Bibl. Locations"
		await expect(page.getByRole("button", { name: "Bibl. Locations", exact: true })).toBeVisible();
		await expect(page.getByRole("button", { name: "Bibl. Locations", exact: true })).toContainClass(
			"data-selected:bg-accent",
		);
	});

	test("should show map with markers in viewport", async ({ page, browserName }) => {
		test.skip(
			browserName === "firefox",
			"WebGL does not work in headless Firefox, see https://bugzilla.mozilla.org/show_bug.cgi?id=1375585",
		);
		await page.goto("/?w=W10=&a=smart-tile");
		// Wait for hydration (clicking before client-side hydration is a no-op)
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		await page.getByRole("navigation").getByRole("button", { name: "Bibliographies" }).click();
		await page
			.locator("[data-slot=navigation-menu-content]")
			.getByText("All Bibl. Locations on Map")
			.click();
		await expect(page.locator(".leaflet-control-container")).toBeVisible();
		await expect(page.locator("img:nth-child(218)")).toBeVisible();
	});
});
