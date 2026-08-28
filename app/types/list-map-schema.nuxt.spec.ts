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
			{ columnId: "ft_feature1", label: "Bedouin dialects", values: ["alpha", "beta"] },
			{ columnId: "ft_feature2", label: "Group 2", values: ["gamma", "delta"] },
		];

		const parsed = roundTrip({ queryString: "ft_feature1:alpha", featureValueGroups: groups });

		expect(parsed.params.queryString).toBe("ft_feature1:alpha");
		expect(parsed.params.featureValueGroups).toEqual(groups);
	});

	it("still restores a link that predates the grouping feature", () => {
		const parsed = roundTrip({ queryString: "ft_feature1:alpha" });

		expect(parsed.params.queryString).toBe("ft_feature1:alpha");
		expect(parsed.params.featureValueGroups).toBeUndefined();
	});
});
