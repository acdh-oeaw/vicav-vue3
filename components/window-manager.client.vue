<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";

const windowsStore = useWindowsStore();
const { arrangeWindows } = windowsStore;
const { registry } = storeToRefs(windowsStore);

const rootElement = ref<HTMLElement | null>(null);

const debouncedArrangeWindows = debounce(arrangeWindows, 150);

useResizeObserver(rootElement, debouncedArrangeWindows);

onMounted(windowsStore.restoreState);
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

.winbox.highlighted {
	animation: bounce 0.2s 3;
}

@keyframes bounce {
	0%,
	100% {
		transform: translateY(-3%);
		animation-timing-function: ease-in-out;
	}

	50% {
		transform: translateY(0);
		animation-timing-function: ease-in-out;
	}
}

.winbox .wb-tei {
	background-color: hsl(var(--color-on-primary));
	mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22128%22%20height%3D%2270%22%20viewBox%3D%220%200%20128%2070%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M10%2010%20h40%20v10%20h-15%20v40%20h-10%20v-40%20h-15%20v-10%22%20fill%3D%22black%22%2F%3E%3Cpath%20d%3D%22M57%2010%20h30%20v10%20h-20%20v10%20h15%20v10%20h-15%20v10%20h20%20v10%20h-30%20v-50%22%20fill%3D%22black%22%2F%3E%3Cpath%20d%3D%22M100%2010%20h10%20v50%20h-10%20v-50%22%20fill%3D%22black%22%2F%3E%3C%2Fsvg%3E");
	mask-position: 50% 50%;
	mask-size: 100%;
	mask-repeat: no-repeat;
}
</style>
