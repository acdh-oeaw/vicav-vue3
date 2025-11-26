import type { JsonObject } from "type-fest";

export function orderByGroup<T = JsonObject>(unordered: Record<string, Array<T>>) {
	return Object.keys(unordered)
		.sort()
		.reduce((obj: Record<string, Array<T>>, key: string) => {
			obj[key] = unordered[key]!;
			return obj;
		}, {});
}
