<script setup lang="ts">
import type { Cell } from "@tanstack/vue-table";

import type { WindowItem } from "@/types/global";

const openOrUpdateWindow = useOpenOrUpdateWindow();
defineProps<{
	valuePrimary: string | Record<string, unknown>;
	valueSecondary?: string;
	cell: Cell<PatchedFeatureType, never>;
}>();
</script>

<template>
	<Button
		class="max-w-[500px] cursor-pointer flex-col items-start truncate py-0 font-medium text-black"
		varian
		variant="link"
		@click="
			openOrUpdateWindow(
				{
					targetType: 'Location',
					params: cell.row,
				} as unknown as WindowItem,
				cell.row.original.properties.name as unknown as string,
			)
		"
		><div class="text-start">{{ valuePrimary }}</div>
		<span v-if="valueSecondary" class="text-xs text-on-muted">{{ valueSecondary }}</span>
	</Button>
</template>
