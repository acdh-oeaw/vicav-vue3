<script lang="ts" setup>
import type { ItemType } from "@/lib/api-client/Api";

const props = defineProps<{
	options: Map<ItemType["target"], ItemType>;
	selected: Set<ItemType["target"]>;
}>();

const emit = defineEmits<{
	(event: "select", id: ItemType["target"]): void;
}>();

function onClickItem(id: ItemType["target"]) {
	emit("select", id);
}
</script>

<template>
	<div class="grid items-center border-b border-border bg-surface px-8 py-3 text-on-surface">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-on-surface/75">
			<button
				v-for="[id, item] of props.options"
				:key="id"
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
