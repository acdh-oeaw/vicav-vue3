<script setup lang="ts">
import type { Cell } from "@tanstack/vue-table";

import { LocationSchema, type WindowItem } from "@/types/global";

const openOrUpdateWindow = useOpenOrUpdateWindow();
const props = defineProps<{
	valuePrimary: string | Record<string, unknown>;
	valueSecondary?: string;
	cell: Cell<PatchedFeatureType, never>;
}>();
function openLocationWindow() {
	openOrUpdateWindow(
		{
			targetType: "Location",
			params: props.cell.row,
		} as unknown as WindowItem,
		props.cell.row.original.properties.name as unknown as string,
		LocationSchema.shape.params,
		"id",
	);
}
</script>

<template>
	<Button
		class="max-w-[500px] cursor-pointer flex-col items-start truncate py-0 font-medium text-black"
		variant="link"
		@click="openLocationWindow"
		><div class="text-start">{{ valuePrimary }}</div>
		<span v-if="valueSecondary" class="text-xs text-on-muted">{{ valueSecondary }}</span>
	</Button>
</template>
