<script setup lang="ts">
import { DropdownMenuItem, type DropdownMenuItemProps, useForwardProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<DropdownMenuItemProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<DropdownMenuItem
		v-bind="forwardedProps"
		:class="
			twMerge(
				'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
				props.class,
			)
		"
	>
		<slot />
	</DropdownMenuItem>
</template>
