<script setup lang="ts">
import { DropdownMenuLabel, type DropdownMenuLabelProps, useForwardProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
	DropdownMenuLabelProps & { class?: HTMLAttributes["class"]; inset?: boolean }
>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<DropdownMenuLabel
		v-bind="forwardedProps"
		:class="twMerge('px-2 py-1.5 text-sm font-semibold', props.class)"
	>
		<slot />
	</DropdownMenuLabel>
</template>
