<script setup lang="ts">
import { DropdownMenuLabel, type DropdownMenuLabelProps } from "radix-vue";

const props = defineProps<DropdownMenuLabelProps & { inset?: boolean }>();
</script>

<template>
	<DropdownMenuLabel
		v-bind="props"
		:class="['px-2 py-1.5 text-sm font-semibold', { 'pl-8': inset }, $attrs.class]"
	>
		<slot />
	</DropdownMenuLabel>
</template>
