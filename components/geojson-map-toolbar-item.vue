<script lang="ts" setup>
import type { Column, Table } from "@tanstack/vue-table";
import { ChevronDown } from "lucide-vue-next";

import { useMarkerStore } from "@/stores/use-marker-store";

const props = defineProps<{
	item: Column<unknown>;
	table: Table<unknown>;
}>();

function titleCase(s: string) {
	return s
		.replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
		.replace(/[-_]+(.)/g, (_, c) => ` ${c.toUpperCase()}`); // First char after each -/_
}

const isCollapsibleOpen = ref(false);

const { markers } = storeToRefs(useMarkerStore());
const { setMarker } = useMarkerStore();

const activeFeatures = computed(() =>
	props.table?.getVisibleLeafColumns().filter((col) => col.getCanHide()),
);
</script>

<template>
	<template v-if="item.columns.length > 0">
		<Collapsible :key="item.id" v-slot="{ open: subcatOpen }" v-model:open="isCollapsibleOpen">
			<CollapsibleTrigger
				class="flex w-full items-center justify-between gap-1 p-2 text-left text-sm"
			>
				<div>
					<span>{{ item.columnDef.header ?? titleCase(item.id) }}</span>
					<Badge
						v-if="
							item.columns.length > 0 &&
							item.getLeafColumns().filter((c) => c.getIsVisible()).length
						"
						class="ml-2"
						variant="outline"
						>{{ item.getLeafColumns().filter((c) => c.getIsVisible()).length }}</Badge
					>
				</div>

				<ChevronDown
					class="size-4 shrink-0 grow-0"
					:class="subcatOpen ? 'rotate-180' : ''"
				></ChevronDown>
			</CollapsibleTrigger>

			<CollapsibleContent class="">
				<GeojsonMapToolbarItem
					v-for="subItem in item.columns"
					:key="subItem.id"
					:item="subItem"
					:table="table"
				/>
			</CollapsibleContent>
		</Collapsible>
	</template>
	<template v-else>
		<DropdownMenuCheckboxItem
			:checked="item.getIsVisible()"
			@mouseover.prevent
			@select.prevent
			@update:checked="
				(value) => {
					item.toggleVisibility(!!value);
					item.setFilterValue(new Map());
				}
			"
		>
			<span class="flex-1">{{ item.columnDef.header }}</span>

			<div v-if="item.getIsVisible()" @click.stop>
				<MarkerSelector
					:icon-categories="['shapes']"
					:model-value="markers.get(item.id)!"
					:type="activeFeatures?.length === 1 ? ['color'] : ['icon']"
					:use-popover-modal="true"
					@click.capture.stop
					@update:model-value="(props) => setMarker(props)"
				></MarkerSelector>
			</div>
			<FeatureSelectionDialog :column="item as Column<unknown>" :table="table" />
		</DropdownMenuCheckboxItem>
	</template>
</template>
