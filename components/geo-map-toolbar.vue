<script lang="ts" setup>
import type { GeoMapSubnavItemSchema } from "@/types/global.d";

type ItemId = string;

const props = defineProps<{
	options: Map<ItemId, Zod.infer<typeof GeoMapSubnavItemSchema>>;
	selected: Set<ItemId>;
}>();

const emit = defineEmits<{
	(event: "select", id: ItemId): void;
}>();

function onClickItem(id: ItemId) {
	emit("select", id);
}
</script>

<template>
	<div class="grid items-center border-b border-border bg-surface px-8 py-3 text-on-surface">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-on-surface/75">
			<button
				v-for="[id, item] of props.options"
				:key="id"
				:aria-pressed="props.selected.has(id)"
				class="cursor-default rounded-sm px-2 py-1.5 transition data-[selected]:bg-accent data-[selected]:text-on-accent"
				:data-selected="props.selected.has(id) || undefined"
				@click="
					() => {
						onClickItem(id);
					}
				"
			>
				{{ item.title }}
			</button>
		</div>
	</div>
</template>
