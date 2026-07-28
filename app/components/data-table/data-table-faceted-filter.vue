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
		displayValue?: (value: string) => string;
		filterLabel?: string;
		sortMode?: FacetSortMode;
		sortValue?: (value: string) => string;
		undefinedValuesLast?: boolean;
	}>(),
	{
		displayValue: (value: string) => value,
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
const facetSearch = ref("");
const filteredFacets = computed(() => {
	const query = facetSearch.value.trim().toLocaleLowerCase();

	if (query.length === 0) return facets.value;

	return facets.value.filter(([value]) => {
		return [value, props.displayValue(value), props.sortValue(value)].some((candidate) =>
			candidate.toLocaleLowerCase().includes(query),
		);
	});
});
const selectedValues = computed(() => cloneFilterValueMap(props.column?.getFilterValue()));
const filterLabel = computed(
	() => props.filterLabel ?? String(props.column.columnDef.header ?? "filter"),
);
const facetSearchInputId = computed(() => {
	return `facet-search-${String(props.column.columnDef.header ?? "filter")
		.toLocaleLowerCase()
		.replace(/\W+/g, "-")}`;
});

function compareFacets(a: readonly [string, number], b: readonly [string, number]): number {
	const undefinedPosition = compareUndefinedValues(a[0], b[0]);

	if (undefinedPosition !== 0) return undefinedPosition;
	if (props.sortMode === "hit-count") {
		const countComparison = b[1] - a[1];

		if (countComparison !== 0) return countComparison;
	}

	return props
		.sortValue(props.displayValue(a[0]))
		.localeCompare(props.sortValue(props.displayValue(b[0])), undefined, {
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
		<DropdownMenuTrigger
			:aria-label="`Filter by ${filterLabel}`"
			class="group rounded-sm p-1 align-middle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			type="button"
			><Filter
				class="size-4 group-hover:scale-125"
				:class="selectedValues.size > 0 && 'fill-white'"
			></Filter
		></DropdownMenuTrigger>
		<DropdownMenuContent class="max-h-[min(24rem,calc(100vh-2rem))] overflow-y-auto">
			<div class="sticky top-0 z-10 bg-white p-1">
				<label class="sr-only" :for="facetSearchInputId">
					Search {{ column.columnDef.header }}
				</label>
				<input
					:id="facetSearchInputId"
					v-model="facetSearch"
					class="h-8 w-full rounded-md border border-input px-2 text-sm"
					placeholder="Search..."
					type="search"
					@click.stop
					@keydown.stop
				/>
			</div>
			<DropdownMenuCheckboxItem
				v-for="facet in filteredFacets"
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
				{{ displayValue(facet[0]) }}
				<Badge class="ml-2" variant="outline">{{ facet[1] }}</Badge>
			</DropdownMenuCheckboxItem>
			<div v-if="filteredFacets.length === 0" class="px-2 py-1.5 text-sm text-muted-foreground">
				No matching filters.
			</div>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
