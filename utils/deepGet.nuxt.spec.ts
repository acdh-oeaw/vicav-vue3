// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { deepGet } from "@/utils/deepGet";

// Google Gemini AI generated tests, @properties added manually
describe("deepGet", () => {
	const obj = {
		a: {
			b: {
				c: "foo",
				"@x": "true",
			},
			d: [1, 2, 3],
		},
		e: null,
		"@hasTEIw": "false",
	};

	it("should return the correct value for a valid nested path", () => {
		expect(deepGet(obj, "a.b.c", null)).toBe("foo");
		expect(deepGet(obj, "a.d[1]", null)).toBe(2);
		expect(deepGet(obj, ["a", "d", 1], null)).toBe(2);
		expect(deepGet(obj, "@hasTEIw", "_bad_")).toBe("false");
		expect(deepGet(obj, "a.b.@x", "_bad_")).toBe("true");
	});

	it("should return the default value for an invalid nested path", () => {
		expect(deepGet(obj, "a.b.d", "bar")).toBe("bar");
		expect(deepGet(obj, "a.d[3]", "baz")).toBe("baz");
		expect(deepGet(obj, ["a", "d", 3], "baz")).toBe("baz");
		expect(deepGet(obj, "a.x.y", "qux")).toBe("qux");
		expect(deepGet(obj, "", "null")).toBe("null");
	});

	it("should return the default value for undefined or null values", () => {
		expect(deepGet(obj, "e.f", "bar")).toBe("bar");
		expect(deepGet(obj, "f.g", "baz")).toBe("baz");
	});

	it("should return the object itself if the query is empty", () => {
		expect(deepGet(obj, [], null)).toBe(obj);
	});
});
