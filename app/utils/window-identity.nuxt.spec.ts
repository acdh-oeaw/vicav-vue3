// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { Schema } from "@/types/global";

import { getWindowIdentity } from "./window-identity";

describe("window identities", () => {
	it.each([
		[
			{ targetType: "WMap", params: { endpoint: "data_markers", queryString: "one" } },
			{ targetType: "WMap", params: { endpoint: "data_markers", queryString: "two" } },
			true,
		],
		[
			{
				targetType: "WMap",
				params: {
					endpoint: "compare_markers",
					queryString: "",
					queryParams: { type: "samples", word: "one" },
				},
			},
			{
				targetType: "WMap",
				params: {
					endpoint: "compare_markers",
					queryString: "",
					queryParams: { type: "samples", word: "two" },
				},
			},
			true,
		],
		[
			{
				targetType: "WMap",
				params: { endpoint: "compare_markers", queryString: "", queryParams: { type: "samples" } },
			},
			{
				targetType: "WMap",
				params: {
					endpoint: "compare_markers",
					queryString: "",
					queryParams: { type: "lingfeatures" },
				},
			},
			false,
		],
		[
			{ targetType: "WMap", params: { endpoint: "other", queryString: "", scope: ["geo", "reg"] } },
			{
				targetType: "WMap",
				params: { endpoint: "other", queryString: "", scope: ["reg", "geo", "geo"] },
			},
			true,
		],
		[
			{ targetType: "CorpusQuery", params: { queryString: "one", mode: "text" } },
			{ targetType: "CorpusQuery", params: { queryString: "one", mode: "tag" } },
			false,
		],
		[
			{ targetType: "Location", params: { id: "one" } },
			{ targetType: "Location", params: { id: "one", showCitation: true } },
			true,
		],
		[
			{ targetType: "FeatureStatistics", params: { featureId: "one" } },
			{ targetType: "FeatureStatistics", params: { featureId: "two" } },
			false,
		],
	])("compares %j with %j", (first, second, same) => {
		expect(getWindowIdentity(Schema.parse(first)) === getWindowIdentity(Schema.parse(second))).toBe(
			same,
		);
	});
	it.each([
		{ targetType: "GeojsonMap", params: {} },
		{ targetType: "FeatureValue", params: { values: [] } },
		{ targetType: "Location", params: {} },
		{ targetType: "WMap", params: { endpoint: "compare_markers", queryString: "" } },
	])("does not reuse missing identities: %j", (state) => {
		expect(getWindowIdentity(Schema.parse(state))).toBeUndefined();
	});
});
