import { expect, test } from "@playwright/test";

test("hydrates configured datasets and shares list filters and map toggles", async ({
	page,
}, testInfo) => {
	const windowErrors: Array<string> = [];
	page.on("console", (message) => {
		if (message.text().includes("global error handler") || message.text().includes("vue:error")) {
			windowErrors.push(message.text());
		}
	});
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
	await expect(searches).toHaveCount(2, { timeout: 15000 });
	await expect(searches.nth(0)).toHaveValue("__no_dataset_matches__");
	await expect(searches.nth(1)).toHaveValue("__no_dataset_matches__");
	for (const title of ["Corpus texts", "Sample texts", "Feature lists", "Profiles"]) {
		await expect(
			page
				.locator("#window-root")
				.getByRole("button", { name: `Toggle ${title} map layer`, exact: true }),
		).toHaveAttribute("aria-pressed", "false");
	}

	await searches.nth(1).fill("__another_empty_filter__");
	await expect(searches.nth(0)).toHaveValue("__another_empty_filter__");
	const corpusToggle = page.getByRole("button", {
		name: "Toggle Corpus texts map layer",
		exact: true,
	});
	await page.locator("#window-root").getByText("Corpus texts", { exact: true }).click();
	await expect(corpusToggle).toHaveAttribute("aria-pressed", "false");
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

	const listToggle = page.getByRole("button", { name: "Toggle Corpus texts list", exact: true });
	await expect(listToggle).toHaveAttribute("aria-pressed", "true");
	await listToggle.click();
	await expect(searches).toHaveCount(0);
	await expect(listToggle).toHaveAttribute("aria-pressed", "false");
	await expect(corpusToggle).toHaveAttribute("aria-pressed", "false");
	await corpusToggle.click();
	await expect(corpusToggle).toHaveAttribute("aria-pressed", "true");
	await expect(searches).toHaveCount(0);
	await listToggle.click();
	await expect(searches).toHaveCount(1);
	await expect(searches.nth(0)).toHaveValue("__another_empty_filter__");
	await expect(corpusToggle).toHaveAttribute("aria-pressed", "true");
	await listToggle.click();
	await expect(searches).toHaveCount(0);
	await expect(corpusToggle).toHaveAttribute("aria-pressed", "true");

	const screenshot = testInfo.outputPath("shared-map-datasets.png");
	expect(windowErrors).toEqual([]);
	await page.screenshot({ path: screenshot });
	await testInfo.attach("shared map datasets", { path: screenshot, contentType: "image/png" });
});

test("opens a preloaded dataset list directly from a map with no lists", async ({
	page,
}, testInfo) => {
	const windows = [
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
	await page.goto(`/?${query.toString()}`);
	const listToggle = page.getByRole("button", { name: "Toggle Corpus texts list", exact: true });
	const layerToggle = page.getByRole("button", {
		name: "Toggle Corpus texts map layer",
		exact: true,
	});
	await expect(listToggle).toHaveAttribute("aria-pressed", "false");
	await expect(page.getByRole("searchbox")).toHaveCount(0);
	await expect(page.getByRole("toolbar", { name: "Map datasets" })).toBeVisible();
	await layerToggle.focus();
	await layerToggle.press("ArrowRight");
	await expect(listToggle).toBeFocused();
	await listToggle.press("Enter");
	await expect(page.getByRole("searchbox")).toHaveCount(1);
	await expect(listToggle).toHaveAttribute("aria-pressed", "true");
	await expect(layerToggle).toHaveAttribute("aria-pressed", "false");
	const mapWindow = page.locator('[data-window-type="WMap"]');
	const root = page.locator("#window-root");
	async function expectMapArrangement(widthPercentage: number) {
		await expect
			.poll(async () => {
				const mapBounds = await mapWindow.boundingBox();
				const rootBounds = await root.boundingBox();
				if (!mapBounds || !rootBounds) return null;
				return {
					width: Math.round((mapBounds.width / rootBounds.width) * 100),
					height: Math.round((mapBounds.height / rootBounds.height) * 100),
					x: Math.round(mapBounds.x - rootBounds.x),
					y: Math.round(mapBounds.y - rootBounds.y),
				};
			})
			.toEqual({
				width: widthPercentage,
				height: 100,
				x: widthPercentage === 50 ? Math.ceil((await root.boundingBox())!.width / 2) : 0,
				y: 0,
			});
	}
	await expectMapArrangement(50);
	await page.locator('[data-window-type="DataList"] .wb-close').click();
	await expectMapArrangement(100);
	await expect(page.getByRole("searchbox")).toHaveCount(0);
	await expect(listToggle).toHaveAttribute("aria-pressed", "false");
	await expect(layerToggle).toHaveAttribute("aria-pressed", "false");
	await listToggle.click();
	await expectMapArrangement(50);
	const sampleToggle = page.getByRole("button", { name: "Toggle Sample texts list", exact: true });
	await sampleToggle.click();
	await expectMapArrangement(50);
	const lists = page.locator('[data-window-type="DataList"]');
	await expect(lists).toHaveCount(2);
	await expect
		.poll(async () => {
			const rootBounds = await root.boundingBox();
			return Promise.all(
				(await lists.all()).map(async (list) => {
					const bounds = (await list.boundingBox())!;
					return {
						width: Math.round((bounds.width / rootBounds!.width) * 100),
						height: Math.round((bounds.height / rootBounds!.height) * 100),
						x: Math.round(bounds.x - rootBounds!.x),
					};
				}),
			);
		})
		.toEqual([
			{ width: 50, height: 50, x: 0 },
			{ width: 50, height: 50, x: 0 },
		]);
	await layerToggle.click();
	await expectMapArrangement(50);
	const screenshot = testInfo.outputPath("toolbar-list-layout.png");
	await page.screenshot({ path: screenshot });
	await testInfo.attach("toolbar list layout", { path: screenshot, contentType: "image/png" });
	await listToggle.click();
	await expect(lists).toHaveCount(1);
	await expectMapArrangement(50);
	await expect
		.poll(async () => {
			const bounds = (await lists.boundingBox())!;
			const rootBounds = (await root.boundingBox())!;
			return Math.round((bounds.height / rootBounds.height) * 100);
		})
		.toBe(100);
	await sampleToggle.click();
	await expectMapArrangement(100);
});
