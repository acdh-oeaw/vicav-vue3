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

const props = defineProps<{
	column: FacetedFilterColumn;
}>();
const facets = computed(() =>
	[...props.column.getFacetedUniqueValues()]
		.map(([value, count]) => [String(value), count] as const)
		.sort((a, b) => b[1] - a[1]),
);
const selectedValues = computed(() => cloneFilterValueMap(props.column?.getFilterValue()));
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="group p-1 align-middle"
			><Filter
				class="size-4 group-hover:scale-125"
				:class="selectedValues.size > 0 && 'fill-white'"
			></Filter
		></DropdownMenuTrigger>
		<DropdownMenuContent>
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
