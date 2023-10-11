<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";

import type { ItemType } from "@/lib/api-client/Api";

const { data } = useProjectInfo();

const itemsById = computed(() => {
	const items = data.value?.projectConfig?.menu?.subnav;

	if (items == null) return new Map<ItemType["target"], ItemType>();

	return keyByToMap(items, (item) => item.target);
});

const selected = ref<Set<ItemType["target"]>>(new Set());

watch(
	itemsById,
	(itemsById) => {
		const value = itemsById.keys().next().value
		if (value != null) {
			selected.value.add(value)
		}
	},
	{ immediate: true },
);

function onClickItem(id: ItemType["target"]) {
	if (selected.value.has(id)) {
		selected.value.delete(id);
	} else {
		selected.value.add(id);
	}
}
</script>

<template>
	<div
		class="grid grid-cols-[1fr_auto] items-center border-b border-border bg-surface px-8 py-3 text-on-surface"
	>
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-on-surface/75">
			<button
				v-for="[id, item] of itemsById"
				:key="id"
				class="cursor-default rounded-sm px-2 py-1.5 transition data-[selected]:bg-accent data-[selected]:text-on-accent"
				:data-selected="selected.has(id) || undefined"
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
