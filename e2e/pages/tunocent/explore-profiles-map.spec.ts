import { expect, test } from "@playwright/test";

test("Take screenshots of map views", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

	// Open Feature Lists map
	await page.getByRole("menuitem", { name: "Profiles" }).click();
	await page.getByRole("menuitem", { name: "Feature Lists" }).click();

	await page.evaluate(() => {
		const allElements = document.querySelectorAll("*");
		for (const el of allElements) {
			if (el.textContent.includes("Show feature lists on map")) {
				(el as HTMLElement).click();
			}
		}
	});
	// Take screenshot of Feature Lists map
	// await page.waitForTimeout(3000);

	// await page.screenshot({
	// 	path: "/Users/osiam/WebProjects/vicav-vue3/e2e/tunocent/feature-lists-map.png",
	// });
	// console.log("Screenshot saved: feature-lists-map.png");

	// Open Profiles map
	// Close current map first
	await page.locator(".wb-close").first().click();

	await page.getByRole("menuitem", { name: "Profiles" }).click();
	await page.getByRole("menuitem", { name: "Feature Lists" }).click();
	await page.getByRole("menuitem", { name: "Profiles" }).click();

	await page.evaluate(() => {
		const allElements = document.querySelectorAll("*");
		for (const el of allElements) {
			if (el.textContent.includes("Show profiles on map")) {
				(el as HTMLElement).click();
			}
		}
	});
	// Take screenshot of Profiles map
	// await page.waitForTimeout(3000);

	// await page.screenshot({
	// 	path: "/Users/osiam/WebProjects/vicav-vue3/e2e/tunocent/profiles-map.png",
	// });
	// console.log("Screenshot saved: profiles-map.png");
});
