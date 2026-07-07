<script setup lang="ts">
import { Filter } from "@lucide/vue";

import { cloneFilterValueMap } from "@/utils/filter-value-map";

interface FacetedFilterColumn {
	columnDef: {
		header?: unknown;
	};
	getFacetedUniqueValues: () => Map<unknown, number>;
	getFilterValue: () => unknown;
	setFilterValue: (value: unknown) => void;
}

type FacetSortMode = "hit-count" | "alphabetical";

const props = withDefaults(
	defineProps<{
		column: FacetedFilterColumn;
		sortMode?: FacetSortMode;
		sortValue?: (value: string) => string;
		undefinedValuesLast?: boolean;
	}>(),
	{
		sortMode: "hit-count",
		sortValue: (value: string) => value,
		undefinedValuesLast: false,
	},
);
const facets = computed(() =>
	[...props.column.getFacetedUniqueValues()]
		.map(([value, count]) => [String(value), count] as const)
		.sort((a, b) => compareFacets(a, b)),
);
const selectedValues = computed(() => cloneFilterValueMap(props.column?.getFilterValue()));

function compareFacets(a: readonly [string, number], b: readonly [string, number]): number {
	const undefinedPosition = compareUndefinedValues(a[0], b[0]);

	if (undefinedPosition !== 0) return undefinedPosition;
	if (props.sortMode === "hit-count") {
		const countComparison = b[1] - a[1];

		if (countComparison !== 0) return countComparison;
	}

	return props.sortValue(a[0]).localeCompare(props.sortValue(b[0]), undefined, {
		numeric: true,
		sensitivity: "base",
	});
}

function compareUndefinedValues(a: string, b: string): number {
	if (!props.undefinedValuesLast) return 0;

	const isEmptyA = props.sortValue(a).length === 0;
	const isEmptyB = props.sortValue(b).length === 0;

	if (isEmptyA && !isEmptyB) return 1;
	if (!isEmptyA && isEmptyB) return -1;

	return 0;
}
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="group p-1 align-middle"
			><Filter
				class="size-4 group-hover:scale-125"
				:class="selectedValues.size > 0 && 'fill-white'"
			></Filter
		></DropdownMenuTrigger>
		<DropdownMenuContent class="max-h-[min(24rem,calc(100vh-2rem))] overflow-y-auto">
			<DropdownMenuCheckboxItem
				v-for="facet in facets"
				:key="facet[0]"
				:checked="selectedValues.has(facet[0])"
				@update:checked="
					(checked) => {
						if (!checked) {
							selectedValues.delete(facet[0]);
						} else {
							selectedValues.set(facet[0], facet[1]);
						}
						column?.setFilterValue(selectedValues);
					}
				"
			>
				{{ facet[0] }}
				<Badge class="ml-2" variant="outline">{{ facet[1] }}</Badge>
			</DropdownMenuCheckboxItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
