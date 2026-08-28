import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Desktop Menu - Single Menu Open", () => {
	test("should only open one dropdown at a time", async ({ page }) => {
		// 1. Open the "Project" menu
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// Scope trigger lookups to the menu list to avoid same-named buttons elsewhere.
		const triggers = page.locator("[data-slot=navigation-menu-list]");
		const projectTrigger = triggers.getByRole("button", { name: "Project", exact: true });
		await projectTrigger.click();

		// Verify Project dropdown is open
		const content = page.locator("[data-slot=navigation-menu-content]");
		await expect(content.getByRole("button", { name: "Mission" })).toBeVisible();

		// 2. Move the mouse to the "Bibliographies" trigger
		await triggers.getByRole("button", { name: "Bibliographies", exact: true }).hover();

		// 3. Verify that Project menu is closed and Bibliographies is open
		// expect: Only one dropdown should be open at a time
		await expect(content.getByRole("button", { name: "Mission" })).toBeHidden();
		await expect(content.getByRole("button", { name: "Explanation" })).toBeVisible();

		// 4. Close the menu.
		// Note: Playwright's click always dispatches a pointermove first, and
		// reka-ui suppresses trigger clicks right after a pointermove (it treats
		// the menu as hover-opened), so use Escape to close instead.
		await page.keyboard.press("Escape");
		await expect(content.getByRole("button", { name: "Mission" })).toBeHidden();
		await expect(content.getByRole("button", { name: "Explanation" })).toBeHidden();
	});
});
