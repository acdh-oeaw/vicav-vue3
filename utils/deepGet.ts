import type { JsonObject, JsonValue } from "type-fest";

// https://gist.github.com/andrewchilds/30a7fb18981d413260c7a36428ed13da?permalink_comment_id=4433741#gistcomment-4433741
// type refactored with Stefan

type ValueType = Record<string | number, unknown>;

export function deepGet(
	value: JsonObject,
	query: string | Array<string | number>,
	defaultVal: JsonValue,
): JsonValue {
	const splitQuery = Array.isArray(query)
		? query
		: query
				.replace(/\[(\d)\]/g, ".$1")
				.replace(/^\./, "")
				.split(".");

	if (!splitQuery.length || splitQuery[0] === undefined) return value;

	const key = splitQuery[0];

	if (
		typeof value !== "object" ||
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		value === null ||
		!(key in value) ||
		(value as ValueType)[key] === undefined
	) {
		return defaultVal;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
	return deepGet((value as any)[key], splitQuery.slice(1), defaultVal);
}
