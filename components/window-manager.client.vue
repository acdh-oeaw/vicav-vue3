<script lang="ts" setup>
import "winbox";

const windowsStore = useWindowsStore();
const { registry } = storeToRefs(windowsStore);
</script>

<template>
	<div
		:id="windowRootId"
		class="pointer-events-none absolute inset-0 isolate z-10 grid h-full w-full overflow-hidden"
	>
		<template v-for="[id, item] of registry" :key="id">
			<Teleport :to="`#${id} .wb-body`">
				<WindowContent :item="item" />
			</Teleport>
		</template>
	</div>
</template>

<style>
.winbox {
	@apply bg-primary shadow-lg border rounded overflow-hidden;

	position: absolute;
	pointer-events: auto;
}

.winbox .wb-header {
	@apply text-on-primary;
}
</style>
