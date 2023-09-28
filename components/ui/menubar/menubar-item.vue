<script setup lang="ts">
import {
	MenubarItem,
	type MenubarItemEmits,
	type MenubarItemProps,
	useEmitAsProps,
} from "radix-vue";

const props = defineProps<MenubarItemProps & { inset?: boolean }>();

const emit = defineEmits<MenubarItemEmits>();

const emitAsProps = useEmitAsProps(emit);
</script>

<template>
	<MenubarItem
		v-bind="{ ...props, ...emitAsProps }"
		:class="[
			'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm focus:bg-accent focus:text-on-accent focus:outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			{ 'pl-8': inset },
		]"
	>
		<slot />
	</MenubarItem>
</template>
