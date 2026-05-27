export class FilterValueMap extends Map<string, number> {
	exclude: Set<string>;

	constructor(entries?: Iterable<[string, number]> | null, exclude?: Iterable<string> | null) {
		super(entries ?? undefined);
		this.exclude = new Set(exclude ?? undefined);
	}
}

export function ensureFilterValueMap(value: unknown): FilterValueMap {
	if (value instanceof FilterValueMap) return value;
	const map = new FilterValueMap();
	if (value instanceof Map) {
		for (const [key, val] of value.entries()) {
			map.set(String(key), Number(val));
		}
	}
	return map;
}

export function cloneFilterValueMap(value: unknown): FilterValueMap {
	const current = ensureFilterValueMap(value);
	return new FilterValueMap(current.entries(), current.exclude);
}

function stringifyFilterValue(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (value == null) return "";
	return JSON.stringify(value);
}

export function matchesFilterValueMap(value: unknown, filterValue: unknown): boolean {
	const map = ensureFilterValueMap(filterValue);

	if (map.size === 0 && map.exclude.size === 0) return true;

	const values = Array.isArray(value)
		? value.map(stringifyFilterValue)
		: [stringifyFilterValue(value)];
	const included = map.size === 0 || values.some((entry) => map.has(entry));
	const excluded = values.some((entry) => map.exclude.has(entry));

	return included && !excluded;
}
