import { expect, test } from "@playwright/test";

test("Take screenshots of map views", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	// close initial About window
	await page.locator(".wb-close").first().click();

	// Open Feature Lists map
	await page.getByRole("button", { name: "Profiles" }).click();
	await page.getByRole("button", { name: "Feature Lists", exact: true }).click();
	await page.getByRole("button", { name: "Show feature lists on map" }).click();

	// Verify the map content is present
	await expect(page.locator(".winbox").first().locator("[data-geo-map]")).toBeVisible();

	// Take screenshot of Feature Lists map
	// await page.waitForTimeout(3000);

	// await page.screenshot({
	// 	path: "/Users/osiam/WebProjects/vicav-vue3/e2e/tunocent/feature-lists-map.png",
	// });
	// console.log("Screenshot saved: feature-lists-map.png");

	// Open Profiles map
	// Close current map first
	await page.locator(".wb-close").first().click();

	await page.getByRole("button", { name: "Profiles" }).click();
	await page.getByRole("button", { name: "Feature Lists", exact: true }).click();
	await page.getByRole("button", { name: "Profiles", exact: true }).click();
	await page.getByRole("button", { name: "Show profiles on map" }).click();

	// Verify the map content is present
	await expect(page.locator(".winbox").first().locator("[data-geo-map]")).toBeVisible();
	// Take screenshot of Profiles map
	// await page.waitForTimeout(3000);

	// await page.screenshot({
	// 	path: "/Users/osiam/WebProjects/vicav-vue3/e2e/tunocent/profiles-map.png",
	// });
	// console.log("Screenshot saved: profiles-map.png");
});
