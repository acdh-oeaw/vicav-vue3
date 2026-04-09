import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Arrow Keys", () => {
	test("should navigate within dropdown using arrow keys", async ({ page }) => {
		// 1. Open "Project" menu
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		await page.getByRole("menuitem", { name: "Project" }).click();

		// Verify first item is focused
		await expect(page.getByRole("menuitem", { name: "Mission" })).toBeFocused();

		// 2. Use Down Arrow to navigate through sub-items
		await page.keyboard.press("ArrowDown");
		await expect(page.getByRole("menuitem", { name: "News" })).toBeFocused();

		await page.keyboard.press("ArrowDown");
		await expect(page.getByRole("menuitem", { name: "Types of Text/Data" })).toBeFocused();

		await page.keyboard.press("ArrowDown");
		await expect(page.getByRole("menuitem", { name: "Contributors" })).toBeFocused();

		await page.keyboard.press("ArrowDown");
		await expect(page.getByRole("menuitem", { name: "Linguistics" })).toBeFocused();

		// 3. Use Up Arrow to navigate back
		await page.keyboard.press("ArrowUp");
		await expect(page.getByRole("menuitem", { name: "Contributors" })).toBeFocused();

		// expect: Each sub-item should receive focus in sequence
	});
});
