<script setup lang="ts">
import { MenubarRoot, type MenubarRootEmits, type MenubarRootProps } from "radix-vue";

const props = defineProps<MenubarRootProps>();

const emit = defineEmits<MenubarRootEmits>();

const emitAsProps = useEmitAsProps(emit);
</script>

<template>
	<MenubarRoot
		v-bind="{ ...props, ...emitAsProps }"
		class="flex h-10 items-center gap-x-1 rounded-md border border-border p-1"
	>
		<slot />
	</MenubarRoot>
</template>
