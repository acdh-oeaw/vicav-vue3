import { expect, test } from "@playwright/test";

// spec: specs/menu-test-plan.md
// seed: e2e/seed.spec.ts

test.describe("Edge Cases - Rapid Clicking", () => {
	test("should handle rapid menu clicking without errors", async ({ page }) => {
		// 1. Navigate to homepage
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });

		// 2. Rapidly click through different menu categories
		for (let i = 0; i < 10; i++) {
			await page.getByRole("menuitem", { name: "Project" }).click();
			await page.getByRole("menuitem", { name: "Bibliographies" }).click();
			await page.getByRole("menuitem", { name: "Profiles" }).click();
			await page.getByRole("menuitem", { name: "Feature Lists" }).click();
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
