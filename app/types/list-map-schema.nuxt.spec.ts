// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { ListMapSchema } from "./global.ts";

/** The window state as it is base64 encoded into the `w` url parameter. */
function roundTrip(params: unknown) {
	const encoded = btoa(JSON.stringify({ targetType: "ListMap", params }));
	return ListMapSchema.parse(JSON.parse(atob(encoded)));
}

describe("ListMap window params", () => {
	it("carries the feature value groups alongside the query string", () => {
		const groups = [
			{
				label: "Bedouin dialects",
				values: [
					{ columnId: "ft_feature1", value: "alpha" },
					{ columnId: "ft_feature1", value: "beta" },
				],
			},
			// a group is free to collect values of several features
			{
				label: "Group 2",
				values: [
					{ columnId: "ft_feature1", value: "gamma" },
					{ columnId: "ft_feature2", value: "delta" },
				],
			},
		];

		const parsed = roundTrip({ queryString: "ft_feature1:alpha", featureValueGroups: groups });

		expect(parsed.params.queryString).toBe("ft_feature1:alpha");
		expect(parsed.params.featureValueGroups).toEqual(groups);
	});

	it("moves a link made before groups could span features onto the new shape", () => {
		const parsed = roundTrip({
			queryString: "ft_feature1:alpha",
			featureValueGroups: [
				{ columnId: "ft_feature1", label: "Bedouin dialects", values: ["alpha", "beta"] },
			],
		});

		expect(parsed.params.featureValueGroups).toEqual([
			{
				label: "Bedouin dialects",
				values: [
					{ columnId: "ft_feature1", value: "alpha" },
					{ columnId: "ft_feature1", value: "beta" },
				],
			},
		]);
	});

	it("still restores a link that predates the grouping feature", () => {
		const parsed = roundTrip({ queryString: "ft_feature1:alpha" });

		expect(parsed.params.queryString).toBe("ft_feature1:alpha");
		expect(parsed.params.featureValueGroups).toBeUndefined();
	});
});
