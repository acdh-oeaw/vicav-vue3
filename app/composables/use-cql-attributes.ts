import { useQuery } from "@tanstack/vue-query";

import type { CqlConfig } from "./use-cql-triggers";

/** A positional attribute as returned by NoSketch Engine's `corp_info` API. */
interface NoskeAttribute {
	name: string;
	label?: string;
	dynamic?: string;
	fromattr?: string;
}

interface NoskeCorpInfo {
	name?: string;
	attributes?: Array<NoskeAttribute>;
	error?: string;
}

function toDisplayValue(attr: NoskeAttribute): string {
	const label = attr.label?.trim();
	if (label) return label;
	// corp_info labels are often empty; fall back to a capitalized attribute name.
	return attr.name.charAt(0).toUpperCase() + attr.name.slice(1);
}

/**
 * Fetches the positional attributes (CQL keys like word, lemma, pos …) of a NoSketch Engine
 * corpus and exposes them as a {@link CqlConfig} ready for {@link useCqlTriggers}. The request
 * goes through the same-origin `/api/cql-attributes` proxy, since the NoSketch instance itself
 * does not send CORS headers. The corpus defaults to the server runtime config.
 */
export function useCqlAttributes(options?: { corpname?: string; enabled?: boolean }) {
	const query = useQuery({
		enabled: options?.enabled,
		queryKey: ["cql-attributes", options?.corpname ?? null] as const,
		async queryFn() {
			const data = await $fetch<NoskeCorpInfo>("/api/cql-attributes", {
				query: options?.corpname ? { corpname: options.corpname } : undefined,
			});
			if (data.error) throw new Error(`NoSketch Engine corp_info error: ${data.error}`);
			return data;
		},
	});

	const cqlConfig = computed<CqlConfig>(() =>
		(query.data.value?.attributes ?? []).map((attr) => ({
			key: attr.name,
			displayValue: toDisplayValue(attr),
		})),
	);

	return { ...query, cqlConfig };
}
