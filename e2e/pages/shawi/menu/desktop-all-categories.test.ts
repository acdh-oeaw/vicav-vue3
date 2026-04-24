import { expect, test } from "@playwright/test";

// spec: specs/shawi-menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - All Categories Visible", () => {
	test("should display About menu with correct submenu items", async ({ page }) => {
		// 1. Click on About menu item and verify submenu items
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Click on About menu item in the menubar (not the submenu item)
		await page.locator("[role='menubar']").getByRole("menuitem", { name: "About" }).click();

		// expect: About menu should contain: About, Team, News
		// Use .first() to get the submenu item, not the menu bar item
		await expect(page.getByRole("menuitem", { name: "About" }).nth(1)).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Team" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "News" })).toBeVisible();
	});

	test("should display Profiles menu with correct submenu items", async ({ page }) => {
		// 1. Click on Profiles menu item and verify submenu items
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Profiles" }).click();

		// expect: Profiles menu should contain: Explanation, Show All Locations, List all entries, Contribute a Profile
		await expect(page.getByRole("menuitem", { name: "Explanation" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Show All Locations" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "List all entries" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Contribute a Profile" })).toBeVisible();
	});

	test("should display Corpus menu with correct submenu items", async ({ page }) => {
		// 1. Click on Corpus menu item and verify submenu items
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Corpus" }).click();

		// expect: Corpus menu should contain: List all entries, Search the corpus, Functional Requirements and Data Specification
		await expect(page.getByRole("menuitem", { name: "List all entries" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Search the corpus" })).toBeVisible();
		await expect(
			page.getByRole("menuitem", { name: "Functional Requirements and Data Specification" }),
		).toBeVisible();
	});

	test("should display Dictionary menu with correct submenu items", async ({ page }) => {
		// 1. Click on Dictionary menu item and verify submenu items
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Dictionary" }).click();

		// expect: Dictionary menu should contain: Search for vocabulary in corpus texts, Functional Requirements and Data Specification
		await expect(
			page.getByRole("menuitem", { name: "Search for vocabulary in corpus texts" }),
		).toBeVisible();
		await expect(
			page.getByRole("menuitem", { name: "Functional Requirements and Data Specification" }),
		).toBeVisible();
	});

	test("should display Windows menu with correct submenu items", async ({ page }) => {
		// 1. Click on Windows menu item and verify submenu items
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

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
