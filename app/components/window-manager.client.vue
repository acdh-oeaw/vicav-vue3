<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";

const windowsStore = useWindowsStore();
const { arrangeWindows } = windowsStore;
const { registry } = storeToRefs(windowsStore);

const route = useRoute();

const rootElement = ref<HTMLElement | null>(null);

const debouncedArrangeWindows = debounce(arrangeWindows, 150);

useResizeObserver(rootElement, debouncedArrangeWindows);

onMounted(() => {
	if (route.path === "/") void windowsStore.restoreState();
});
</script>

<template>
	<div
		:id="windowRootId"
		ref="rootElement"
		class="pointer-events-none absolute inset-0 isolate z-10 grid size-full overflow-hidden"
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
@reference "@/styles/index.css";

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

.winbox .wb-cite {
	background-color: hsl(var(--color-on-primary));
	mask-image: url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2224%22%20height=%2224%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22currentColor%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20class=%22lucide%20lucide-quote%22%3E%3Cpath%20d=%22M16%203a2%202%200%200%200-2%202v6a2%202%200%200%200%202%202%201%201%200%200%201%201%201v1a2%202%200%200%201-2%202%201%201%200%200%200-1%201v2a1%201%200%200%200%201%201%206%206%200%200%200%206-6V5a2%202%200%200%200-2-2z%22/%3E%3Cpath%20d=%22M5%203a2%202%200%200%200-2%202v6a2%202%200%200%200%202%202%201%201%200%200%201%201%201v1a2%202%200%200%201-2%202%201%201%200%200%200-1%201v2a1%201%200%200%200%201%201%206%206%200%200%200%206-6V5a2%202%200%200%200-2-2z%22/%3E%3C/svg%3E");
	mask-position: 50% 50%;
	mask-size: 60%;
	mask-repeat: no-repeat;
}
</style>
