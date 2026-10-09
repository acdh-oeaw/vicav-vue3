import { expect, test } from "@playwright/test";

test("hydrates configured datasets and shares list filters and map toggles", async ({
	page,
}, testInfo) => {
	const windows = [
		{
			targetType: "DataList",
			title: "First corpus list",
			params: {
				dataTypes: ["CorpusText"],
				filterListBy: { key: "country", value: "__no_country_matches__" },
				listState: { globalFilter: "__no_dataset_matches__" },
			},
		},
		{
			targetType: "DataList",
			title: "Second corpus list",
			params: {
				dataTypes: ["CorpusText"],
				filterListBy: { key: "country", value: "Different country" },
			},
		},
		{
			targetType: "WMap",
			title: "Data lists map",
			params: { endpoint: "data_markers", queryString: "" },
		},
	];
	const query = new URLSearchParams({
		w: Buffer.from(JSON.stringify(windows)).toString("base64"),
		a: "smart-tile",
	});
	const projectRequests: Array<string> = [];
	page.on("request", (request) => {
		if (new URL(request.url()).pathname.endsWith("/vicav/project")) {
			projectRequests.push(request.url());
		}
	});
	await page.goto(`/?${query.toString()}`);
	expect(await page.locator("script#__NUXT_DATA__").textContent()).toContain('"configured:corpus"');

	const searches = page.getByRole("searchbox");
	await expect(searches).toHaveCount(2);
	await expect(searches.nth(0)).toHaveValue("__no_dataset_matches__");
	await expect(searches.nth(1)).toHaveValue("__no_dataset_matches__");
	for (const title of ["Corpus texts", "Sample texts", "Feature lists", "Profiles"]) {
		await expect(
			page.locator("#window-root").getByRole("button", { name: title, exact: true }),
		).toHaveAttribute("aria-pressed", "false");
	}

	await searches.nth(1).fill("__another_empty_filter__");
	await expect(searches.nth(0)).toHaveValue("__another_empty_filter__");
	const corpusToggle = page.getByRole("button", { name: "Corpus texts", exact: true });
	await corpusToggle.click();
	await expect(corpusToggle).toHaveAttribute("aria-pressed", "true");
	const listMapControls = page.locator(".wb-map");
	await expect(listMapControls).toHaveCount(2);
	await expect(listMapControls.nth(0)).toHaveAttribute("aria-pressed", "true");
	await expect(listMapControls.nth(1)).toHaveAttribute("aria-pressed", "true");
	await listMapControls.nth(0).click();
	await expect(corpusToggle).toHaveAttribute("aria-pressed", "false");
	await expect(listMapControls.nth(1)).toHaveAttribute("aria-pressed", "false");
	await expect
		.poll(() => {
			const encoded = new URL(page.url()).searchParams.get("w");
			if (!encoded) return [];
			const states = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as Array<{
				targetType: string;
				params: { mapSyncId?: string; filterListBy?: { key: string; value: string } };
			}>;
			return states
				.filter((state) => state.targetType === "DataList")
				.map(({ params }) => ({ mapSyncId: params.mapSyncId, filterListBy: params.filterListBy }));
		})
		.toEqual([
			{
				mapSyncId: "configured:corpus",
				filterListBy: { key: "country", value: "__no_country_matches__" },
			},
			{
				mapSyncId: "configured:corpus",
				filterListBy: { key: "country", value: "__no_country_matches__" },
			},
		]);
	expect(projectRequests).toEqual([]);

	const screenshot = testInfo.outputPath("shared-map-datasets.png");
	await page.screenshot({ path: screenshot });
	await testInfo.attach("shared map datasets", { path: screenshot, contentType: "image/png" });
});
