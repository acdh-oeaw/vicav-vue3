import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Project Dropdown", () => {
	test("should open Project menu and display all 5 items", async ({ page }) => {
		// 1. Navigate to the homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Click on the "Project" trigger
		// (scoped to the menu list to avoid same-named buttons elsewhere)
		const trigger = page
			.locator("[data-slot=navigation-menu-list]")
			.getByRole("button", { name: "Project", exact: true });
		await trigger.click();

		// expect: Project menu should be expanded (active state)
		await expect(trigger).toHaveAttribute("aria-expanded", "true");

		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

		// 3. Verify the dropdown menu appears with the following items:
		const expectedItems = ["Mission", "News", "Types of Text/Data", "Contributors", "Linguistics"];

		for (const item of expectedItems) {
			await expect(content.getByRole("button", { name: item })).toBeVisible();
		}

		// expect: Dropdown should display all 5 menu items
		const dropdownItems = content.locator("[data-slot=navigation-menu-link]");
		await expect(dropdownItems).toHaveCount(5);

		// expect: Each menu item should be clickable
		await content.getByRole("button", { name: "Mission" }).click();
		await expect(
			page
				.locator("div")
				.filter({ hasText: /^Mission$/ })
				.nth(1),
		).toBeVisible();
	});
});
