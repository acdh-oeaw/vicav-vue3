import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Enter", () => {
	test("should open dropdown when Enter is pressed", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Scope trigger lookups to the menu list to avoid same-named buttons elsewhere
		// (e.g. map window layer buttons).
		const triggers = page.locator("[data-slot=navigation-menu-list]");
		const project = triggers.getByRole("button", { name: "Project", exact: true });

		// 2. Tab to the first trigger.
		// Winbox moves focus into the last open window on page load, and browsers
		// skip off-screen / empty-named tab stops when tabbing from body
		// (the skip link is off-screen; the logo link has no accessible name).
		// Click a neutral spot in the header to reset focus to body, then tab
		// until the first trigger is focused (1-3 Tabs depending on browser).
		await page.mouse.click(5, 30);
		for (let i = 0; i < 4; i++) {
			await page.keyboard.press("Tab");
			if (await project.evaluate((el) => el === document.activeElement)) break;
		}
		await expect(project).toBeFocused();

		// 3. Press Enter (native button activation triggers the trigger click handler)
		await page.keyboard.press("Enter");

		// 4. Verify Project dropdown opens
		// expect: Dropdown menu should open when Enter is pressed
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content).toBeVisible();
		await expect(content.getByRole("button", { name: "Mission" })).toBeVisible();
	});
});
