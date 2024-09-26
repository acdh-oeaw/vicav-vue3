// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { orderByGroup } from "./orderByGroup";

// Generated using Google Gemini AI
describe("orderByGroup", () => {
	it("should order an object by key", () => {
		const unordered = {
			c: [
				{ id: 1, name: "test1" },
				{ id: 2, name: "test2" },
			],
			a: [
				{ id: 3, name: "test3" },
				{ id: 4, name: "test4" },
			],
			b: [
				{ id: 5, name: "test5" },
				{ id: 6, name: "test6" },
			],
		};
		const ordered = {
			a: [
				{ id: 3, name: "test3" },
				{ id: 4, name: "test4" },
			],
			b: [
				{ id: 5, name: "test5" },
				{ id: 6, name: "test6" },
			],
			c: [
				{ id: 1, name: "test1" },
				{ id: 2, name: "test2" },
			],
		};
		expect(orderByGroup(unordered)).toEqual(ordered);
	});
});
