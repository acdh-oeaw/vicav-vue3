<script lang="ts" setup>
import { Map as MapIcon, Table as TableIcon } from "@lucide/vue";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group/index.ts";

type ItemId = string;
export interface GeoMapToolbarOption {
	title?: string;
	color?: string;
	listOpen?: boolean;
}

const props = defineProps<{
	options: Map<ItemId, GeoMapToolbarOption>;
	selected: Set<ItemId>;
}>();

const emit = defineEmits<{
	select: [id: ItemId];
	"toggle-list": [id: ItemId];
}>();

const activeControls = computed(() =>
	[...props.options].flatMap(([id, item]) => [
		...(props.selected.has(id) ? [`${id}:layer`] : []),
		...(item.listOpen ? [`${id}:list`] : []),
	]),
);
</script>

<template>
	<div
		aria-label="Map datasets"
		class="grid items-center border-b border-border bg-surface px-8 py-3 text-on-surface"
		role="toolbar"
	>
		<ToggleGroup
			aria-label="Dataset visibility"
			class="flex flex-wrap justify-start gap-x-4 gap-y-1 p-0 text-sm font-medium text-on-surface/75"
			:model-value="activeControls"
			type="multiple"
		>
			<div
				v-for="[id, item] of props.options"
				:key="id"
				class="inline-flex items-center"
				:class="item.listOpen != null ? 'rounded-sm border border-border' : ''"
			>
				<span class="inline-flex items-center px-2 py-1.5">
					<span
						v-if="item.color"
						aria-hidden="true"
						class="mr-2 inline-block size-2.5 rounded-full"
						:style="{ backgroundColor: item.color }"
					></span>
					{{ item.title }}
				</span>
				<ToggleGroupItem
					:aria-label="`Toggle ${item.title} map layer`"
					class="data-[state=on]:text-on-accent"
					size="sm"
					:title="`${props.selected.has(id) ? 'Hide' : 'Show'} ${item.title} map layer`"
					type="button"
					:value="`${id}:layer`"
					@click="emit('select', id)"
				>
					<MapIcon aria-hidden="true" class="size-4" />
				</ToggleGroupItem>
				<ToggleGroupItem
					v-if="item.listOpen != null"
					:aria-label="`Toggle ${item.title} list`"
					class="border-l border-border data-[state=on]:text-on-accent"
					size="sm"
					:title="`${item.listOpen ? 'Hide' : 'Show'} ${item.title} list`"
					type="button"
					:value="`${id}:list`"
					@click="emit('toggle-list', id)"
				>
					<TableIcon aria-hidden="true" class="size-4" />
				</ToggleGroupItem>
			</div>
		</ToggleGroup>
	</div>
</template>
