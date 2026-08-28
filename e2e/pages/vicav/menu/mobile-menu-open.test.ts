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
		// 3. Click the "Toggle navigation" button
		await page.getByRole("button", { name: /Toggle navigation/i }).click();

		// 4. Verify a dialog/overlay with "Navigation menu" appears
		// expect: Mobile navigation dialog should appear with all main menu categories
		const dialog = page.locator('[role="dialog"]');
		await expect(dialog).toBeVisible();
		// Use getByText with exact match and first() since elements may have multiple matches
		await expect(dialog.getByText("Project", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Bibliographies", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Profiles", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Feature Lists", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Samples", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Texts", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Dictionaries", { exact: true }).first()).toBeVisible();
		await expect(dialog.getByText("Tools & Technology", { exact: true }).first()).toBeVisible();
	});
});
