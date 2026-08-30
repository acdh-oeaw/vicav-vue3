import { expect, type Page, test } from "@playwright/test";

export function expectToBeDefined<T>(value: T | undefined): asserts value is T {
	expect(value).toBeDefined();
}

test.describe("Data Sections", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#window-root")).toBeInViewport({ timeout: 30000 });
		// close initial About window
		await page.locator(".wb-close").first().click();
	});

	async function getNewestWindow(page: Page) {
		// Get all windows and return the last one (newest)
		const windows = await page.locator(".winbox").all();
		return windows[windows.length - 1];
	}

	test("TC-005: Profiles - List All Entries", async ({ page }) => {
		// Hover on Profiles button to reveal dropdown
		await page.getByRole("button", { name: "Profiles" }).hover();
		//

		// Click on "List all entries"
		await page.getByText("List all entries").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the window contains content (list items)
		await expect(winbox.locator("ul")).toBeVisible();
	});

	test("TC-006: Profiles - Show on Map", async ({ page }) => {
		// Hover on Profiles button to reveal dropdown
		await page.getByRole("button", { name: "Profiles" }).hover();

		// Click on "Show profiles on map"
		await page.getByText("Show profiles on map").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the map content is present
		await expect(winbox.locator("[data-geo-map]")).toBeVisible();
	});

	test("TC-007: Feature Lists - List All", async ({ page }) => {
		// Hover on Feature Lists button to reveal dropdown
		await page.getByRole("button", { name: "Feature Lists" }).hover();

		// Click on "List all feature lists"
		await page.getByText("List all feature lists").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify content is present
		await expect(winbox.locator("ul")).toBeVisible();
	});

	test("TC-008: Feature Lists - Show on Map", async ({ page }) => {
		// Hover on Feature Lists button to reveal dropdown
		await page.getByRole("button", { name: "Feature Lists" }).hover();

		// Click on "Show feature lists on map"
		await page.getByText("Show feature lists on map").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the map content is present
		await expect(winbox.locator("[data-geo-map]")).toBeVisible();
	});

	test("TC-009: Feature Lists - Search Interface", async ({ page }) => {
		// Hover on Feature Lists button to reveal dropdown
		await page.getByRole("button", { name: "Feature Lists" }).hover();

		// Click on "Search and compare feature lists"
		await page.getByText("Search and compare feature lists").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the search form has the expected fields by checking for labels
		await expect(winbox.getByText("Place", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Speaker identifier", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Age", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Sex", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Word", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Features", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Translation", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Comment", { exact: true })).toBeVisible();
		await expect(winbox.getByRole("button", { name: "Query" })).toBeVisible();
	});

	test("TC-010: Sample Texts - List All", async ({ page }) => {
		// Hover on Sample Texts button to reveal dropdown
		await page.getByRole("button", { name: "Sample Texts" }).hover();

		// Click on "List all sample texts"
		await page.getByText("List all sample texts").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify content is present
		await expect(winbox.locator("ul")).toBeVisible();
	});

	test("TC-011: Sample Texts - Show on Map", async ({ page }) => {
		// Hover on Sample Texts button to reveal dropdown
		await page.getByRole("button", { name: "Sample Texts" }).hover();

		// Click on "Show sample texts on map"
		await page.getByText("Show sample texts on map").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the map content is present
		await expect(winbox.locator("[data-geo-map]")).toBeVisible();
	});

	test("TC-012: Sample Texts - Search Interface", async ({ page }) => {
		// Hover on Sample Texts button to reveal dropdown
		await page.getByRole("button", { name: "Sample Texts" }).hover();

		// Click on "Search and compare sample texts"
		await page.getByText("Search and compare sample texts").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the search form has the expected fields
		await expect(winbox.getByText("Place", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Speaker identifier", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Age", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Sex", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Word", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Sentences", { exact: true })).toBeVisible();
		await expect(winbox.getByText("Comment", { exact: true })).toBeVisible();
		await expect(winbox.getByRole("button", { name: "Query" })).toBeVisible();
	});

	test("TC-013: Corpus Texts - List All", async ({ page }) => {
		// Hover on Corpus Texts button to reveal dropdown
		await page.getByRole("button", { name: "Corpus Texts" }).hover();

		// Click on "List all transcribed entries"
		await page.getByText("List all transcribed entries").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify content is present
		await expect(winbox.locator("ul")).toBeVisible();
	});

	test("TC-014: Corpus Texts - Search", async ({ page }) => {
		// Hover on Corpus Texts button to reveal dropdown
		await page.getByRole("button", { name: "Corpus Texts" }).hover();

		// Click on "Search the corpus"
		await page.getByText("Search the corpus").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the search form has the expected fields - corpus search has word/CQL input
		await expect(winbox.locator("input[type='text'], input[type='search']").first()).toBeVisible();
		await expect(winbox.getByText(/Search for words or enter a CQL query/i)).toBeVisible();
	});

	test("TC-015: Browse Data - List All", async ({ page }) => {
		// Hover on Browse data button to reveal dropdown
		await page.getByRole("button", { name: "Browse data" }).hover();

		// Click on "List all data recordings"
		await page.getByText("List all data recordings").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify content is present (table or list)
		const hasTable = (await winbox.getByRole("table").count()) > 0;
		const hasList = (await winbox.locator("ul").count()) > 0;
		expect(hasTable || hasList).toBe(true);
	});

	test("TC-016: Browse Data - Show Locations", async ({ page }) => {
		// Hover on Browse data button to reveal dropdown
		await page.getByRole("button", { name: "Browse data" }).hover();

		// Click on "Show all locations"
		await page.getByText("Show all locations").click();

		// Get the newest window
		const winbox = await getNewestWindow(page);

		expectToBeDefined(winbox);

		await expect(winbox).toBeVisible();

		// Verify the map content is present
		await expect(winbox.locator("[data-geo-map]")).toBeVisible();
	});
});
