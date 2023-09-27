<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";

import type { SubnavType } from "@/lib/api-client/Api";

const windowsStore = useWindowsStore();
const { registry } = storeToRefs(windowsStore);

const { data } = useProjectInfo();

const itemsById = computed(() => {
	const items = data.value?.projectConfig?.menu?.subnav;

	if (items == null) return new Map<SubnavType["id"], SubnavType>();

	return keyByToMap(items, (item) => item.id);
});

const selected = ref<SubnavType["id"] | null>(null);

watch(
	itemsById,
	(itemsById) => {
		selected.value = itemsById.keys().next().value ?? null;
	},
	{ immediate: true },
);

const isVisible = computed(() => {
	if (selected.value == null) return false;

	const isVisible = !registry.value.has(selected.value);

	return isVisible;
});

const params = computed(() => {
	if (selected.value == null) return null;

	const item = itemsById.value.get(selected.value);

	// @ts-expect-error Property missing in api types.
	return item?.query ?? null;
});

function onSelect(id: SubnavType["id"]) {
	selected.value = id;
}
</script>

<template>
	<div class="relative isolate grid h-full w-full grid-rows-[auto_1fr]">
		<!-- TODO: instead on a list of buttons, this should probably be a select? -->
		<div
			class="grid grid-cols-[1fr_auto] items-center border-b border-border bg-surface px-8 py-3 text-on-surface"
		>
			<div
				class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-on-surface/75"
			>
				<button
					v-for="[id, item] of itemsById"
					:key="id"
					class="cursor-default rounded-sm px-2 py-1.5 transition data-[selected]:bg-accent data-[selected]:text-on-accent"
					:data-selected="id === selected || undefined"
					@click="
						() => {
							onSelect(id);
						}
					"
				>
					{{ item.title }}
				</button>
			</div>

			<div>
				<Switch aria-label="Toggle background map" class="mx-3" />
			</div>
		</div>

		<div class="relative isolate grid h-full w-full">
			<GeoMapWindowContent v-if="isVisible && params != null" :params="params" />

			<WindowManager />
		</div>
	</div>
</template>
