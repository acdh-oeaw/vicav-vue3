import { expect, test } from "@playwright/test";

test.describe("Window Management", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	// eslint-disable-next-line playwright/expect-expect
	test.fixme("TC-020: Window Arrangement - Cascade", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Profiles" }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await page.getByRole("menuitem", { name: "Feature Lists" }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await page.getByRole("menuitem", { name: /^Windows/ }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
	});

	// eslint-disable-next-line playwright/expect-expect
	test.fixme("TC-021: Window Arrangement - Tile", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Profiles" }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await page.getByRole("menuitem", { name: "Feature Lists" }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await page.getByRole("menuitem", { name: /^Windows/ }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
	});

	// eslint-disable-next-line playwright/expect-expect
	test.fixme("TC-022: Window Arrangement - Smart Tile", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Profiles" }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await page.getByRole("menuitem", { name: "Feature Lists" }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await page.getByRole("menuitem", { name: /^Windows/ }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
	});

	test("TC-023: Window Close", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Profiles" }).click();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		await expect(page.locator("main")).toBeVisible();
	});
});
