import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Mobile Menu - Open on Toggle Click", () => {
	test("should open mobile menu when toggle button is clicked", async ({ page }) => {
		// 1. Set viewport to 480x800
		await page.setViewportSize({ width: 480, height: 800 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Navigate to the homepage
		// 3. Click the "Toggle menu" button
		await page.getByRole("button", { name: /Toggle menu/i }).click();

		// 4. Verify a dialog/overlay with "Navigation menu" appears
		// expect: Mobile navigation dialog should appear with all main menu categories
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Project" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Bibliographies" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Profiles" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Feature Lists" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Samples" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Texts" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Dictionaries" })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: "Tools & Technology" })).toBeVisible();
	});
});
