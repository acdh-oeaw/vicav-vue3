import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Project Dropdown", () => {
	test("should open Project menu and display all 5 items", async ({ page }) => {
		// 1. Navigate to the homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on the "Project" menu item
		await page.getByRole("menuitem", { name: "Project" }).click();

		// expect: Project menu should be expanded (active state)
		await expect(page.getByRole("menuitem", { name: "Project" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);

		// 3. Verify the dropdown menu appears with the following items:
		const expectedItems = ["Mission", "News", "Types of Text/Data", "Contributors", "Linguistics"];

		for (const item of expectedItems) {
			await expect(page.getByRole("menuitem", { name: item })).toBeVisible();
		}

		// expect: Dropdown should display all 5 menu items
		const dropdownItems = page.locator("[role='menu'] >> role=menuitem");
		await expect(dropdownItems).toHaveCount(5);

		// expect: Each menu item should be clickable
		await page.getByRole("menuitem", { name: "Mission" }).click();
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^Mission$/ })
				.nth(1),
		).toBeVisible();
	});
});
