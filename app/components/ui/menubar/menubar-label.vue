<script setup lang="ts">
import { MenubarLabel, type MenubarLabelProps } from "radix-vue";

const props = defineProps<MenubarLabelProps & { inset?: boolean }>();
</script>

<template>
	<MenubarLabel v-bind="props" :class="['px-2 py-1.5 text-sm font-semibold', { 'pl-8': inset }]">
		<slot />
	</MenubarLabel>
</template>
