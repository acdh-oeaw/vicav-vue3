import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Tools & Technology Dropdown", () => {
	test("should open Tools & Technology menu and display all 16 items", async ({ page }) => {
		// 1. Click on "Tools & Technology" menu item
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Tools & Technology" }).click();

		// Get reference to the dropdown menu
		const dropdown = page.locator("[role='menu']").last();

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
			await expect(dropdown.getByRole("menuitem", { name: item })).toBeVisible();
		}

		// expect: All 16 menu items are visible and clickable
		const dropdownItems = dropdown.locator("[role='menuitem']");
		await expect(dropdownItems).toHaveCount(16);
	});
});
