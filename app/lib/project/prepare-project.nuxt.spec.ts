// @vitest-environment nuxt
import { dehydrate, hydrate, QueryClient } from "@tanstack/vue-query";
import { describe, expect, it, vi } from "vitest";

import type { ProjectResponse } from "@/types/project.ts";
import { SimpleTEIMetadataSchema } from "@/types/teiCorpus.ts";
import { createProjectValidationReporter } from "@/utils/project-validation-toasts.ts";

import { prepareProject } from "./prepare-project.ts";

function fixture(etag?: string): ProjectResponse {
	return {
		ETag: etag,
		projectConfig: {
			staticData: {
				table: [
					{ "@id": "invalid-corpus", TEIs: [{ "@id": 123 }] },
					{ text: { body: { listPlace: [{ "@id": "invalid-place" }] } } },
				],
				geo: [{ type: "FeatureCollection", features: [{ type: "invalid" }] }],
			} as unknown as NonNullable<NonNullable<ProjectResponse["projectConfig"]>["staticData"]>,
		},
	};
}

describe("project preparation diagnostics", () => {
	it("initializes empty diagnostics for valid empty static data", async () => {
		const entry = await prepareProject({ projectConfig: {} }, "empty");
		expect(entry.response.projectConfig?._validationErrors).toEqual([]);
		expect(entry.simpleItems).toEqual([]);
	});

	it("shares frozen serializable diagnostics for concurrent requests", async () => {
		const entries = await Promise.all(
			Array.from({ length: 5 }, () => prepareProject(fixture("invalid"), "concurrent")),
		);
		for (const entry of entries) expect(entry).toBe(entries[0]);
		const response = entries[0]!.response;
		const diagnostics = response.projectConfig!._validationErrors!;
		expect(diagnostics.map((item) => item.source)).toEqual([
			"corpus",
			"geographic-place",
			"geojson",
		]);
		expect(JSON.parse(JSON.stringify(diagnostics))).toEqual(diagnostics);
		expect(Object.isFrozen(diagnostics[0]!.issues[0])).toBe(true);
		expect(() => (diagnostics as unknown as Array<unknown>).pop()).toThrow();
		expect(response.projectConfig!.staticData!.geo![0]!.features).toEqual([null]);
		expect(entries[0]!.simpleItems).toEqual([]);
	});

	it("separates backend, data version, unversioned and authenticated preparations", async () => {
		const first = await prepareProject(fixture("same"), "backend-a");
		expect(await prepareProject(fixture("same"), "backend-a")).toBe(first);
		expect(await prepareProject(fixture("same"), "backend-b")).not.toBe(first);
		expect(await prepareProject(fixture("changed"), "backend-a")).not.toBe(first);
		const authenticated = await prepareProject(fixture("same"), "backend-a", {
			authenticated: true,
		});
		expect(authenticated).not.toBe(first);
		expect(await prepareProject(fixture("same"), "backend-a", { authenticated: true })).not.toBe(
			authenticated,
		);
		const unversioned = await prepareProject(fixture(), "backend-a");
		expect(await prepareProject(fixture(), "backend-a")).not.toBe(unversioned);
	});

	it("captures derived metadata failures while dropping only the failed metadata", async () => {
		const error = SimpleTEIMetadataSchema.safeParse({}).error!;
		const parse = vi
			.spyOn(SimpleTEIMetadataSchema, "safeParse")
			.mockReturnValueOnce({ success: false, error });
		try {
			const entry = await prepareProject(
				{
					ETag: "derived-failure",
					projectConfig: {
						staticData: {
							table: [
								{
									"@id": "corpus",
									TEIs: [
										{
											"@id": "text",
											teiHeader: {
												fileDesc: {
													titleStmt: { titles: [{ $: "Title" }] },
													publicationStmt: { publishers: [], idno: { $: "text" } },
													sourceDesc: {},
												},
											},
										},
									],
								},
							],
						},
					},
				},
				"derived",
			);
			expect(parse).toHaveBeenCalledTimes(1);
			expect(entry.simpleItems).toEqual([]);
			expect(entry.response.projectConfig!._validationErrors).toEqual([
				expect.objectContaining({
					source: "metadata",
					itemId: "text",
					issues: error.issues.map(({ code, path, message }) => ({ code, path, message })),
				}),
			]);
		} finally {
			parse.mockRestore();
		}
	});

	it("preserves GeoJSON diagnostics when rebuilding hydrated project metadata", async () => {
		const original = await prepareProject(fixture("geo-hydration"), "server");
		const hydrated = JSON.parse(JSON.stringify(original.response)) as ProjectResponse;
		const rebuilt = await prepareProject(hydrated, "browser");
		expect(
			rebuilt.response.projectConfig!._validationErrors?.filter(
				(item) => item.source === "geojson",
			),
		).toEqual(
			original.response.projectConfig!._validationErrors?.filter(
				(item) => item.source === "geojson",
			),
		);
	});

	it("dehydrates server diagnostics and reports once after browser hydration", async () => {
		const prepared = await prepareProject(fixture("ssr-browser"), "regression");
		const server = new QueryClient();
		server.setQueryData(["get-project-info"], prepared.response);
		const browser = new QueryClient();
		hydrate(browser, JSON.parse(JSON.stringify(dehydrate(server))));
		const response = browser.getQueryData<ProjectResponse>(["get-project-info"])!;
		const add = vi.fn();
		const remove = vi.fn();
		const report = createProjectValidationReporter(add, remove);
		expect(add).not.toHaveBeenCalled();
		// The client plugin invokes this reporter only from app:mounted.
		report(response);
		expect(add).toHaveBeenCalledTimes(3);
		const diagnostics = JSON.stringify(response.projectConfig!._validationErrors);
		remove("project-validation:corpus");
		report(response);
		report(structuredClone(response));
		expect(add).toHaveBeenCalledTimes(3);
		expect(JSON.stringify(response.projectConfig!._validationErrors)).toBe(diagnostics);
		report({ ...response, ETag: "new-version" });
		expect(add).toHaveBeenCalledTimes(6);
		report({ ETag: "valid-version", projectConfig: { _validationErrors: [] } });
		expect(remove).toHaveBeenCalledWith("project-validation:geojson");
		server.clear();
		browser.clear();
	});
});
