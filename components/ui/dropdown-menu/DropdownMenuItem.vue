<script setup lang="ts">
import { DropdownMenuItem, type DropdownMenuItemProps } from "radix-vue";

const props = defineProps<DropdownMenuItemProps & { inset?: boolean }>();
</script>

<template>
	<DropdownMenuItem
		v-bind="props"
		:class="[
			'focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			{ 'pl-8': inset },
			$attrs.class,
		]"
	>
		<slot />
	</DropdownMenuItem>
</template>
