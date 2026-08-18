// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { FilterValueMap } from "@/utils/filter-value-map.ts";
import {
	deserializeSimpleMetadataFacetFilters,
	getSimpleMetadataFacetValueLabel,
	serializeSimpleMetadataFacetFilters,
} from "@/utils/simple-metadata-facets.ts";

const transcriptionDefault = { "@hasTEIw": ["true"] };

describe("simple metadata facet labels", () => {
	it.each([
		["@hasTEIw", "true", "Available"],
		["@hasTEIw", "false", "Unavailable"],
		["audioAvailability", "free", "Public"],
		["audioAvailability", "restricted", "Restricted"],
		["audioAvailability", "unknown", "Unknown"],
	])("displays %s=%s as %s", (columnId, value, label) => {
		expect(getSimpleMetadataFacetValueLabel(columnId, value)).toBe(label);
	});

	it("preserves an unmapped raw value", () => {
		expect(getSimpleMetadataFacetValueLabel("audioAvailability", "embargoed")).toBe("embargoed");
	});
});

describe("simple metadata default facets", () => {
	it("applies a default when list state has no value for that facet", () => {
		const filters = deserializeSimpleMetadataFacetFilters(undefined, transcriptionDefault);

		expect(filters).toHaveLength(1);
		expect(filters[0]?.id).toBe("@hasTEIw");
		expect(filters[0]?.value).toEqual(new FilterValueMap([["true", 1]]));
	});

	it("lets an explicit saved value override the default", () => {
		const filters = deserializeSimpleMetadataFacetFilters(
			{ facets: { "@hasTEIw": ["false"] } },
			transcriptionDefault,
		);

		expect(filters[0]?.value).toEqual(new FilterValueMap([["false", 1]]));
	});

	it("treats an explicit empty value as an opt-out", () => {
		const filters = deserializeSimpleMetadataFacetFilters(
			{ facets: { "@hasTEIw": [] } },
			transcriptionDefault,
		);

		expect(filters[0]?.value).toEqual(new FilterValueMap());
	});

	it("preserves an empty default facet when serializing", () => {
		const facets = serializeSimpleMetadataFacetFilters([], transcriptionDefault);

		expect(facets).toEqual({ "@hasTEIw": [] });
	});

	it("round-trips the cleared default without reapplying it", () => {
		const serialized = serializeSimpleMetadataFacetFilters([], transcriptionDefault);
		const deserialized = deserializeSimpleMetadataFacetFilters(
			{ facets: serialized },
			transcriptionDefault,
		);

		expect(deserialized[0]?.value).toEqual(new FilterValueMap());
	});

	it("serializes selected values under their raw facet keys", () => {
		const facets = serializeSimpleMetadataFacetFilters(
			[
				{ id: "@hasTEIw", value: new FilterValueMap([["true", 1]]) },
				{ id: "audioAvailability", value: new FilterValueMap([["free", 3]]) },
			],
			transcriptionDefault,
		);

		expect(facets).toEqual({ "@hasTEIw": ["true"], audioAvailability: ["free"] });
	});

	it("does not introduce facet state for lists without defaults", () => {
		expect(serializeSimpleMetadataFacetFilters([], {})).toEqual({});
		expect(deserializeSimpleMetadataFacetFilters(undefined, {})).toEqual([]);
	});

	it("continues to deserialize existing raw list state without defaults", () => {
		const filters = deserializeSimpleMetadataFacetFilters(
			{ facets: { audioAvailability: ["free"], country: ["Austria"] } },
			{},
		);

		expect(filters).toEqual([
			{ id: "audioAvailability", value: new FilterValueMap([["free", 1]]) },
			{ id: "country", value: new FilterValueMap([["Austria", 1]]) },
		]);
	});
});
