// @vitest-environment nuxt
import type { JsonObject } from "type-fest";
import { describe, expect, it } from "vitest";

import { getGroupedItems } from "./groupByFourLevels";

describe("getGroupedItems", () => {
	const testData: Array<JsonObject> = [
		{
			"@id": "item2",
			place: {
				country: "Germany",
				region: "Bavaria",
				settlement: "Munich",
			},
			dataType: "LexicalEntry",
			label: "Item 2",
		},
		{
			"@id": "item1",
			place: {
				country: "Germany",
				region: "Bavaria",
				settlement: "Munich",
			},
			dataType: "CorpusText",
			label: "Item 1",
			"@hasTEIw": "true",
		},
		{
			"@id": "item3",
			place: {
				country: "Germany",
				region: "Bavaria",
				settlement: "Nuremberg",
			},
			dataType: "CorpusText",
			label: "Item 3",
			"@hasTEIw": "true",
		},
		{
			"@id": "item4",
			place: {
				country: "France",
				region: "Île-de-France",
				settlement: "Paris",
			},
			dataType: "CorpusText",
			label: "Item 4",
			"@hasTEIw": "true",
		},
		{
			"@id": "item5",
			place: {
				country: "Germany",
				region: "Bavaria",
				settlement: "Munich",
			},
			dataType: "CorpusText",
			label: "Item 5",
			"@hasTEIw": "false",
		},
	];

	it("should group items by four levels", () => {
		const grouped = getGroupedItems(
			testData,
			["place.country", "place.region", "place.settlement", "dataType"],
			"dataType",
			["CorpusText"],
			"label",
		);

		expect(Object.keys(grouped)).toEqual(expect.arrayContaining(["Germany", "France"]));
		expect(Object.keys(grouped.Germany!)).toEqual(["Bavaria"]);
		expect(Object.keys(grouped.Germany!.Bavaria!)).toEqual(
			expect.arrayContaining(["Munich", "Nuremberg"]),
		);
		expect(Object.keys(grouped.Germany!.Bavaria!.Munich!)).toEqual(["CorpusText"]);
	});

	it("should filter items by dataType", () => {
		const grouped = getGroupedItems(
			testData,
			["place.country", "place.region", "place.settlement", "dataType"],
			"dataType",
			["CorpusText"],
			"label",
		);

		expect(grouped.Germany!.Bavaria!.Munich!.CorpusText).toHaveLength(2);
		expect(grouped.Germany!.Bavaria!.Munich!.LexicalEntry).toBeUndefined();
		expect(grouped.Germany!.Bavaria!.Nuremberg!.CorpusText).toHaveLength(1);

		const grouped2 = getGroupedItems(
			testData,
			["place.country", "place.region", "place.settlement", "dataType"],
			"dataType",
			["CorpusText", "LexicalEntry"],
			"label",
		);
		expect(grouped2.Germany!.Bavaria!.Munich!.CorpusText).toHaveLength(2);
		expect(grouped2.Germany!.Bavaria!.Munich!.LexicalEntry).toHaveLength(1);
		expect(grouped2.Germany!.Bavaria!.Nuremberg!.CorpusText).toHaveLength(1);
	});

	it("should sort items by label", () => {
		const grouped = getGroupedItems(
			testData,
			["place.country", "place.region", "place.settlement", "dataType"],
			"dataType",
			["CorpusText"],
			"label",
		);

		expect(grouped.Germany!.Bavaria!.Munich!.CorpusText![0]!["@id"]).toBe("item1");
	});

	it("should filter items by filterListBy", () => {
		const grouped = getGroupedItems(
			testData,
			["place.country", "place.region", "place.settlement", "dataType"],
			"dataType",
			["CorpusText"],
			"label",
			{ key: "@hasTEIw", value: "true" },
		);

		expect(grouped.Germany!.Bavaria!.Munich!.CorpusText).toHaveLength(1);
	});

	it("should handle missing properties gracefully", () => {
		const testDataWithMissingProps: Array<JsonObject> = [
			...testData,
			{
				"@id": "item6",
				place: {
					country: "Germany",
					settlement: "Berlin",
				},
				dataType: "CorpusText",
				label: "Item 6",
			},
		];

		const grouped = getGroupedItems(
			testDataWithMissingProps,
			["place.country", "place.region", "place.settlement", "dataType"],
			"dataType",
			["CorpusText"],
			"label",
		);

		expect(grouped.Germany!.Bavaria!.Munich!.CorpusText).toHaveLength(2);
		expect(grouped.Germany![""]!.Berlin!.CorpusText).toHaveLength(1);
	});
});
