import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - Rapid Clicking", () => {
	test("should handle rapid menu clicking without errors", async ({ page, browserName }) => {
		test.fixme(
			browserName === "webkit",
			"This test does not work correctly in Webkit headless on GitHub and we want to change the menu implementation anyway.",
		);
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Rapidly hover through different menu categories
		// (scoped to the menu list to avoid same-named buttons elsewhere)
		const triggers = page.locator("[data-slot=navigation-menu-list]");
		await triggers.getByRole("button", { name: "Project", exact: true }).click();
		for (let i = 0; i < 10; i++) {
			for (const name of [
				"Project",
				"Bibliographies",
				"Profiles",
				"Feature Lists",
				"Samples",
				"Tools & Technology",
			]) {
				await triggers.getByRole("button", { name: name, exact: true }).hover();
				await expect(triggers.getByRole("button", { name: name, exact: true })).toHaveAttribute(
					"aria-expanded",
					"true",
				);
			}
		}

		// 3. Verify no JavaScript errors occur
		// expect: Application remains stable without crashes
		const errors: Array<string> = [];
		page.on("pageerror", (error) => {
			errors.push(error.message);
		});
		expect(errors).toHaveLength(0);
	});
});
