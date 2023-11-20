<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";
import type { LocationQueryRaw } from "vue-router";

const windowsStore = useWindowsStore();
const { arrangeWindows } = windowsStore;
const { registry } = storeToRefs(windowsStore);
const route = useRoute();

const rootElement = ref<HTMLElement | null>(null);

const debouncedArrangeWindows = debounce(arrangeWindows, 150);

useResizeObserver(rootElement, debouncedArrangeWindows);

onMounted(async () => {
	if (!route.query.w || !route.query.a) {
		navigateEmpty();
	}

	// TODO validate with zod
	let windowState = JSON.parse(route.query.w as string);
	if (!Array.isArray(windowState)) {
		navigateEmpty();
	}

	await nextTick();
	windowState.forEach((w) => {
		windowsStore.addWindow({
			title: w.title,
			kind: w.kind,
			params: w.params,
		});
	});
	windowsStore.setWindowArrangement(route.query.a as WindowArrangement);
});

function navigateEmpty() {
	navigateTo({
		path: "/",
		query: { w: "[]", a: windowsStore.arrangement },
	});
}
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

		<div v-if="registry.size === 0" class="absolute inset-0 grid h-1/4 w-full place-items-center">
			<div class="text-sm text-on-muted">Select a menu item to open a new window.</div>
		</div>
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
