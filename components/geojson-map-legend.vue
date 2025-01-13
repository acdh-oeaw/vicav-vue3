<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";

import type { GeojsonMapSchema } from "@/types/global";

interface Props {
	params: Zod.infer<typeof GeojsonMapSchema>["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);

const table = computed(() => tables.value.get(params.value.url));
const activeFeatures = computed(() =>
	table.value?.getVisibleLeafColumns().filter((col) => col.getCanHide()),
);
const activeRows = computed(() => table.value?.getFilteredRowModel().rows);
function getMatchingRowCount(columnId: string) {
	return activeRows.value?.filter((row) => (row.getValue(columnId) as Array<unknown>).length > 0)
		.length;
}
const collapsibleOpen = ref(true);

const { buildFeatureValueId } = useColorsStore();
</script>

<template>
	<Collapsible v-model:open="collapsibleOpen">
		<div class="w-48 bg-white/80 p-3 text-xs">
			<CollapsibleTrigger class="flex w-full justify-between"
				><b>{{ activeRows?.length }} total markers</b
				><ChevronDown class="size-4" :class="collapsibleOpen ? '' : 'rotate-180'"></ChevronDown
			></CollapsibleTrigger>
			<CollapsibleContent>
				<div v-for="feature in activeFeatures" :key="feature.id" class="my-1">
					<div class="flex items-start gap-2">
						<svg class="mt-0.5 size-3.5">
							<use href="#petal" :style="{ fill: `var(--${feature.id})` }"></use>
						</svg>
						<span>{{ feature.columnDef.header }} ({{ getMatchingRowCount(feature.id) }})</span>
					</div>
					<div
						v-if="feature.getIsFiltered() && (feature.getFilterValue() as Array<string>).length > 0"
						class="ml-2"
					>
						<div
							v-for="[value, count] in [...feature.getFacetedUniqueValues().entries()].filter(
								([value, count]) => (feature.getFilterValue() as Array<string>).includes(value),
							)"
							:key="value"
							class="flex items-center"
						>
							<svg class="mt-0.5 size-3.5">
								<use
									href="#petal"
									:style="{ fill: `var(--${buildFeatureValueId(feature.id, value)})` }"
								></use>
							</svg>
							<span>{{ value }} ({{ count }})</span>
						</div>
					</div>
				</div></CollapsibleContent
			>
		</div>
	</Collapsible>
</template>
