import type { JsonObject } from "type-fest";
import { describe, expect, it } from "vitest";

import { jsonStringsToObject } from "./jsonStringsToObject";

describe("jsonStringsToObject", () => {
	it("should parse JSON strings and replace them with objects", () => {
		const input = {
			param1: '{"name": "John", "age": 30}',
			param2: '{"city": "New York"}',
		};
		const expectedOutput = {
			param1: { name: "John", age: 30 },
			param2: { city: "New York" },
		};

		const output = jsonStringsToObject(input);
		expect(output).toEqual(expectedOutput);
	});

	it("should leave non-JSON strings unchanged", () => {
		const input = {
			param1: "Not a JSON string",
			param2: '{"valid": "json"}',
		};
		const expectedOutput = {
			param1: "Not a JSON string",
			param2: { valid: "json" },
		};

		const output = jsonStringsToObject(input);
		expect(output).toEqual(expectedOutput);
	});

	it("should handle objects that already contain JSON objects", () => {
		const input = {
			param1: { existing: "object" } as JsonObject,
			param2: '{"valid": "json"}',
		};
		const expectedOutput = {
			param1: { existing: "object" },
			param2: { valid: "json" },
		};

		const output = jsonStringsToObject(input);
		expect(output).toEqual(expectedOutput);
	});

	it("should handle an empty object", () => {
		const input = {};
		const expectedOutput = {};

		const output = jsonStringsToObject(input);
		expect(output).toEqual(expectedOutput);
	});

	it("should handle mixed types within the object", () => {
		const input = {
			param1: '{"name": "John"}',
			param2: "Not a JSON string",
			param3: 42,
			param4: { existing: "object" } as JsonObject,
		};
		const expectedOutput = {
			param1: { name: "John" },
			param2: "Not a JSON string",
			param3: 42,
			param4: { existing: "object" },
		};

		const output = jsonStringsToObject(input);
		expect(output).toEqual(expectedOutput);
	});
});
