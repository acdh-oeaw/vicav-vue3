import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Arrow Keys", () => {
	test("should navigate within dropdown using arrow keys", async ({ page }) => {
		// 1. Open "Project" menu.
		// Note: Playwright's click dispatches a pointermove before the click, so
		// reka-ui opens the menu through its hover logic (short delay) rather than
		// the click itself. Wait for the content to be visible before pressing keys.
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Scope trigger lookups to the menu list to avoid same-named buttons elsewhere
		// (e.g. map window layer buttons).
		const triggers = page.locator("[data-slot=navigation-menu-list]");
		const project = triggers.getByRole("button", { name: "Project", exact: true });
		await project.click();
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();

		// webkit does not move focus to a button on mouse click, so focus the
		// trigger explicitly before using the keyboard.
		await project.focus();

		// 2. ArrowDown moves focus from the trigger into the content (first item)
		await page.keyboard.press("ArrowDown");
		await expect(content.getByRole("button", { name: "Mission" })).toBeFocused();

		// 3. Use Down Arrow to navigate through sub-items
		await page.keyboard.press("ArrowDown");
		await expect(content.getByRole("button", { name: "News" })).toBeFocused();

		await page.keyboard.press("ArrowDown");
		await expect(content.getByRole("button", { name: "Types of Text/Data" })).toBeFocused();

		await page.keyboard.press("ArrowDown");
		await expect(content.getByRole("button", { name: "Contributors" })).toBeFocused();

		await page.keyboard.press("ArrowDown");
		await expect(content.getByRole("button", { name: "Linguistics" })).toBeFocused();

		// 4. Use Up Arrow to navigate back
		await page.keyboard.press("ArrowUp");
		await expect(content.getByRole("button", { name: "Contributors" })).toBeFocused();

		// expect: Each sub-item should receive focus in sequence
	});
});
