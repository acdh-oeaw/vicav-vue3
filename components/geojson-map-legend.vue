<script setup lang="ts">
import type { GeojsonMapSchema } from "@/types/global";

interface Props {
	params: Zod.infer<typeof GeojsonMapSchema>["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { colors } = useColorsStore();
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
</script>

<template>
	<div class="bg-white/80 p-2 text-xs">
		<span
			><b>{{ activeRows?.length }} total markers</b></span
		>
		<div v-for="feature in activeFeatures" :key="feature.id" class="flex items-start gap-2">
			<svg class="mt-0.5 size-3.5">
				<use :fill="colors.get(feature.id)?.colorCode" href="#petal"></use>
			</svg>
			<span class="w-32"
				>{{ feature.columnDef.header }} ({{ getMatchingRowCount(feature.id) }})</span
			>
		</div>
	</div>
</template>
