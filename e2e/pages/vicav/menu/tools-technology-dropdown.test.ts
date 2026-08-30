import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Tools & Technology Dropdown", () => {
	test("should open Tools & Technology menu and display all 16 items", async ({ page }) => {
		// 1. Click on "Tools & Technology" trigger
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Tools & Technology", exact: true })
			.click();

		// Get reference to the dropdown content
		const dropdown = page.locator("[data-slot=navigation-menu-content]");
		await expect(dropdown).toBeVisible();

		// 2. Verify dropdown contains:
		const expectedItems = [
			"Dictionary Editor (VLE)",
			"Arabic Research Tools",
			"Corpora (Spoken Varieties)",
			"Corpora (MSA)",
			"Special Corpora",
			"Corpora (Historical Varieties)",
			"Dictionaries",
			"Language Processing Tools",
			"Other Websites & Projects",
			"Learning Materials",
			"Textbook Syrian Arabic (Sound files)",
			"Textbook Baghdad Arabic (Sound files)",
			"Vocabularies on Smartphones",
			"Available Programs",
			"Available Data",
			"Keyboard Layouts",
		];

		for (const item of expectedItems) {
			await expect(dropdown.getByRole("button", { name: item })).toBeVisible();
		}

		// expect: All 16 menu items are visible and clickable
		const dropdownItems = dropdown.locator("[data-slot=navigation-menu-link]");
		await expect(dropdownItems).toHaveCount(16);
	});
});
