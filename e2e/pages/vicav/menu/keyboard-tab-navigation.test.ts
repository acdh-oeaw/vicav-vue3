import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Keyboard Navigation - Tab", () => {
	test("should tab through menu items in order", async ({ page }) => {
		// browserName
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Press Tab to navigate to the menubar - this should focus the first menu item
		// Tab sequence: skip link -> menubar -> first menuitem (Project)
		await page.keyboard.press("Tab"); // Skip to main content link, webkit: First menuitem (Project) on Windows

		//if (browserName !== "webkit") {
		await page.keyboard.press("Tab"); // VICAV logo
		await page.keyboard.press("Tab"); // First menuitem (Project)
		//}

		// 3. Verify focus is on Project
		await expect(page.getByRole("menuitem", { name: "Project" })).toBeFocused();

		// 4. After Project is focused, use Right Arrow to navigate through remaining menu items
		// Radix UI menubar uses arrow keys for navigation within the menubar
		await page.keyboard.press("ArrowRight");
		await expect(page.getByRole("menuitem", { name: "Bibliographies" })).toBeFocused();

		await page.keyboard.press("ArrowRight");
		await expect(page.getByRole("menuitem", { name: "Profiles" })).toBeFocused();

		await page.keyboard.press("ArrowRight");
		await expect(page.getByRole("menuitem", { name: "Feature Lists" })).toBeFocused();

		await page.keyboard.press("ArrowRight");
		await expect(page.getByRole("menuitem", { name: "Samples" })).toBeFocused();
	});
});
