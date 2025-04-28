import type { JsonObject } from "type-fest";

export function jsonStringsToObject(obj: Record<string, string | JsonObject | number>): JsonObject {
	const result: JsonObject = Object.assign({}, obj);
	for (const key in result) {
		if (typeof result[key] === "string") {
			try {
				const parsed: JsonObject = JSON.parse(result[key]) as JsonObject;
				result[key] = parsed;
			} catch {
				// If parsing fails, leave the value as is.
			}
		}
	}
	return result;
}
