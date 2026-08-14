// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { parseBiblioTeiResponse } from "./use-biblio-tei-query.ts";

describe("parseBiblioTeiResponse", () => {
	it("returns renderable html when bibliography entries are present", () => {
		const result = parseBiblioTeiResponse(
			'<div xmlns:tei="http://www.tei-c.org/ns/1.0"><div class="dvStats">Query: test</div><div class="dvStats">1 record</div><div class="dvBibBook"><div class="dvAuthor">Author</div><div class="dvBiblBlock">Title</div></div></div>',
		);

		expect(result).toMatchObject({
			stats: "Query: test",
			hasResults: true,
		});
		expect(result.html).toContain("dvBibBook");
		expect(result.html).not.toContain("Query: test");
	});

	it("returns an empty result for non-bibliography xml", () => {
		const result = parseBiblioTeiResponse(
			'<?xml version="1.0" encoding="UTF-8"?><TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body><p>arbitrary xml</p></body></text></TEI>',
		);

		expect(result).toEqual({
			stats: "0 results",
			html: "",
			hasResults: false,
		});
	});

	it("preserves the API stats text for zero-hit html responses", () => {
		const result = parseBiblioTeiResponse(
			'<div xmlns="http://www.w3.org/1999/xhtml" xmlns:tei="http://www.tei-c.org/ns/1.0"><div class="dvStats" id="dvStats">0&nbsp;hits</div></div>',
		);

		expect(result).toEqual({
			stats: "0\u00A0hits",
			html: "",
			hasResults: false,
		});
	});
});
