import type { ColumnFilter } from "@tanstack/vue-table";

import type { SimpleMetadataListState } from "@/types/global.ts";
import { ensureFilterValueMap, FilterValueMap } from "@/utils/filter-value-map.ts";

export type SimpleMetadataFacetSelections = NonNullable<SimpleMetadataListState["facets"]>;

const facetValueLabels: Record<string, Record<string, string>> = {
	"@hasTEIw": {
		false: "Unavailable",
		true: "Available",
	},
	audioAvailability: {
		free: "Public",
		restricted: "Restricted",
		unknown: "Unknown",
	},
};

export function getSimpleMetadataFacetValueLabel(columnId: string, value: string): string {
	return facetValueLabels[columnId]?.[value] ?? value;
}

export function deserializeSimpleMetadataFacetFilters(
	listState: SimpleMetadataListState | undefined,
	defaultFacets: SimpleMetadataFacetSelections,
): Array<ColumnFilter> {
	const facets = cloneFacetSelections(defaultFacets);

	for (const [id, values] of Object.entries(listState?.facets ?? {})) {
		facets[id] = [...values];
	}

	return Object.entries(facets).map(([id, values]) => {
		return {
			id,
			value: new FilterValueMap(values.map((value) => [value, 1])),
		};
	});
}

export function serializeSimpleMetadataFacetFilters(
	columnFilters: Array<ColumnFilter>,
	defaultFacets: SimpleMetadataFacetSelections,
): SimpleMetadataFacetSelections {
	const facets: SimpleMetadataFacetSelections = Object.fromEntries(
		Object.keys(defaultFacets).map((id) => [id, []]),
	);

	for (const filter of columnFilters) {
		const values = [...ensureFilterValueMap(filter.value).keys()];

		if (values.length > 0 || Object.hasOwn(defaultFacets, filter.id)) {
			facets[filter.id] = values;
		}
	}

	return facets;
}

function cloneFacetSelections(
	facets: SimpleMetadataFacetSelections,
): SimpleMetadataFacetSelections {
	return Object.fromEntries(Object.entries(facets).map(([id, values]) => [id, [...values]]));
}
