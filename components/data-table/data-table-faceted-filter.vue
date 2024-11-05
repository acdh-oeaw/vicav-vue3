<script setup lang="ts">
import type { Column } from "@tanstack/vue-table";
import { Filter } from "lucide-vue-next";

const props = defineProps<{
	column: Column<never, unknown>;
}>();
const facets = computed(() => props.column?.getFacetedUniqueValues());
const selectedValues = computed(() => new Set(props.column?.getFilterValue() as Array<string>));
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger class="group p-1 align-middle"
			><Filter class="size-4 group-hover:scale-125"></Filter
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
							selectedValues.add(facet[0]);
						}
						column?.setFilterValue([...selectedValues]);
					}
				"
			>
				{{ facet[0] }}
				<Badge class="ml-2" variant="outline">{{ facet[1] }}</Badge>
			</DropdownMenuCheckboxItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
