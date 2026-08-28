import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Tab", () => {
	test("should tab through menu items in order", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Scope trigger lookups to the menu list: the map window has its own
		// layer buttons (e.g. "Profiles", "Samples") that would otherwise collide.
		const triggers = page.locator("[data-slot=navigation-menu-list]");
		const project = triggers.getByRole("button", { name: "Project", exact: true });

		// 2. Tab to the first menu trigger.
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

		// 3. After Project is focused, use Right Arrow to navigate through remaining triggers
		// NavigationMenu uses arrow keys to move between triggers
		await page.keyboard.press("ArrowRight");
		await expect(
			triggers.getByRole("button", { name: "Bibliographies", exact: true }),
		).toBeFocused();

		await page.keyboard.press("ArrowRight");
		await expect(triggers.getByRole("button", { name: "Profiles", exact: true })).toBeFocused();

		await page.keyboard.press("ArrowRight");
		await expect(
			triggers.getByRole("button", { name: "Feature Lists", exact: true }),
		).toBeFocused();

		await page.keyboard.press("ArrowRight");
		await expect(triggers.getByRole("button", { name: "Samples", exact: true })).toBeFocused();
	});
});
