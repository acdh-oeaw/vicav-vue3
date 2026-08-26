import type { TriggerMap } from "@/components/searchbar";

export interface CqlKeyword {
	key: string;
	displayValue: string;
	values?: Array<{ value: string; displayValue: string }>;
}

export type CqlConfig = Array<CqlKeyword>;

export function useCqlTriggers(config: Ref<CqlConfig> | CqlConfig) {
	const cqlTriggers = computed<TriggerMap>(() => {
		const cfg = isRef(config) ? config.value : config;
		const entries: Array<[string, Array<{ value: string; displayValue: string }>]> = [];

		const keywordChoices = cfg.map((kw) => ({
			value: `${kw.key}=`,
			displayValue: kw.displayValue,
		}));
		// Values for the "" trigger carry the "[" prefix so handleSelect can insert [keyword=""] directly
		const keywordChoicesWithBracket = cfg.map((kw) => ({
			value: `[${kw.key}=`,
			displayValue: kw.displayValue,
		}));

		// "" trigger → shown at token boundaries in multi-value-searchbar (empty doc, after space/])
		entries.push(["", keywordChoicesWithBracket]);
		// "[" trigger → keyword choices (featureTrigger "[" will be prepended by handleSelect)
		entries.push(["[", keywordChoices]);

		// "[keyword=" trigger → predefined values (quoted), or empty list for free-text
		for (const kw of cfg) {
			entries.push([
				`[${kw.key}=`,
				(kw.values ?? []).map((v) => ({ value: `"${v.value}"`, displayValue: v.displayValue })),
			]);
		}

		return new Map(entries);
	});

	return { cqlTriggers };
}
