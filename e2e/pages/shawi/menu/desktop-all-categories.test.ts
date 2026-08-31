import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - All Categories Visible", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// close initial About window
		await page.locator(".wb-close").first().click();
	});

	test("should display About menu with correct submenu items", async ({ page }) => {
		// Click on About menu item in the menubar (not the submenu item)
		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "About" })
			.click();

		// expect: About menu should contain: About, Team, News
		// Use .first() to get the submenu item, not the menu bar item
		await expect(page.getByRole("button", { name: "The Shawi Project" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Team" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Contributors" })).toBeVisible();
	});

	test("should display Profiles menu with correct submenu items", async ({ page }) => {
		await page.getByRole("button", { name: "Places" }).click();

		// expect: Profiles menu should contain: Explanation, Show All Locations, List all entries, Contribute a Profile
		await expect(page.getByRole("button", { name: "Şanlıurfa" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Arabic place names" })).toBeVisible();
	});

	test("should display Corpus menu with correct submenu items", async ({ page }) => {
		await page.getByRole("button", { name: "Corpus" }).click();

		// expect: Corpus menu should contain: List all entries, Search the corpus, Functional Requirements and Data Specification
		await expect(page.getByRole("button", { name: "List all transcriptions" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Search the corpus" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Corpus Documentation" })).toBeVisible();
	});

	test("should display Dictionary menu with correct submenu items", async ({ page }) => {
		await page.getByRole("button", { name: "Dictionary" }).click();

		// expect: Dictionary menu should contain: Search for vocabulary in corpus texts, Functional Requirements and Data Specification
		await expect(page.getByRole("button", { name: "Search the dictionary" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Dictionary Documentation" })).toBeVisible();
	});

	test("should display Windows menu with correct submenu items", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Windows" }).click();

		// expect: Windows menu should contain: No windows open, Arrangement section with None, Cascade, Tile, Smart tile, Column 5 Flex
		// "No windows open" is shown as text when no windows are open
		await expect(page.getByText("No windows open")).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "None", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Cascade", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Tile", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Smart tile", exact: true })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Column 5 Flex", exact: true })).toBeVisible();
	});
});
