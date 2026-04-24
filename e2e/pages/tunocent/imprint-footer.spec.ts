import { expect, test } from "@playwright/test";

test.describe("Imprint & Footer", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
	});

	test("TC-024: Imprint Page Navigation", async ({ page }) => {
		await page.getByRole("link", { name: "Imprint" }).click();
		await expect(page.getByRole("heading", { name: "Imprint" })).toBeInViewport();
		await expect(page).toHaveURL(/imprint/);
	});

	test("TC-025: Imprint Page Content", async ({ page }) => {
		test.slow();
		await page.goto("/imprint", { waitUntil: "domcontentloaded" });
		await expect(page.getByRole("heading", { name: "Imprint" })).toBeInViewport();
	});

	test("TC-026: Footer Contact Link", async ({ page }) => {
		const footer = page.locator("footer");
		await footer.hover();

		const contactLink = page.locator("footer a[href^='mailto:acdh-helpdesk']");
		await contactLink.hover();
		await expect(contactLink).toHaveAttribute("href", /mailto:acdh-helpdesk@oeaw.ac.at/);
	});

	test("TC-027: Footer DOI Link", async ({ page }) => {
		const footer = page.locator("footer");
		await footer.hover();

		const doiLink = page.locator("footer a[href*='doi.org']").first();
		await doiLink.hover();
		await expect(doiLink).toHaveAttribute("href", /https:\/\/doi\.org\/10\.55776\/P31647/);
	});
});
