<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";

const windowsStore = useWindowsStore();
const { arrangeWindows } = windowsStore;
const { registry } = storeToRefs(windowsStore);

const rootElement = ref<HTMLElement | null>(null);

const debouncedArrangeWindows = debounce(arrangeWindows, 150);

useResizeObserver(rootElement, debouncedArrangeWindows);
</script>

<template>
	<div
		:id="windowRootId"
		ref="rootElement"
		class="pointer-events-none absolute inset-0 isolate z-10 grid h-full w-full overflow-hidden"
	>
		<template v-for="[id, item] of registry" :key="id">
			<Teleport :to="`#${id} .wb-body`">
				<WindowContent :item="item" />
			</Teleport>
		</template>

		<Centered v-if="registry.size === 0">
			<div class="text-sm text-on-muted">Select a menu item to open a new window.</div>
		</Centered>
	</div>
</template>

<style>
.winbox {
	@apply bg-primary shadow-lg border rounded overflow-hidden;

	position: absolute;
	pointer-events: auto;
}

.winbox.no-move .wb-drag {
	cursor: default;
}

.winbox .wb-header {
	@apply text-on-primary;
}

.winbox .wb-title {
	@apply font-body;
}
</style>
