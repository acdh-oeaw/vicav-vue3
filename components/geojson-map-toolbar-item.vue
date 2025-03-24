<script lang="ts" setup>
import type { Column, Table } from "@tanstack/vue-table";
import { ChevronDown } from "lucide-vue-next";

import { useColorsStore } from "@/stores/use-colors-store";

const _props = defineProps<{
	item: Column<unknown>;
	table: Table<unknown>;
}>();

function titleCase(s: string) {
	return s
		.replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
		.replace(/[-_]+(.)/g, (_, c) => ` ${c.toUpperCase()}`); // First char after each -/_
}

const isCollapsibleOpen = ref(false);

const { colors } = storeToRefs(useColorsStore());
const { setColor } = useColorsStore();
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
			@select.prevent
			@update:checked="
				(value) => {
					item.toggleVisibility(!!value);
					item.setFilterValue(new Map());
				}
			"
		>
			<span class="flex-1">{{ item.columnDef.header }}</span>

			<label
				v-if="item.getIsVisible()"
				class="ml-3 flex grow-0 basis-0 items-center p-0"
				@click.capture.stop
			>
				<div
					class="size-4 rounded"
					:style="{
						backgroundColor: `var(--${item.id})`,
						stroke: `var(--${item.id})`,
					}"
				></div>
				<input
					class="size-0"
					type="color"
					:value="colors.get(item.id)?.colorCode || '#cccccc'"
					@click.capture.stop
					@input="
						(event) => {
							//@ts-expect-error target.value not recognized
							setColor({ id: item.id, colorCode: event.target!.value });
						}
					"
				/>
				<span class="sr-only">Select color</span>
			</label>
			<FeatureSelectionDialog :column="item as Column<unknown>" :table="table" />
		</DropdownMenuCheckboxItem>
	</template>
</template>
