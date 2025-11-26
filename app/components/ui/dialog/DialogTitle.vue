<script setup lang="ts">
import { DialogTitle, type DialogTitleProps, useForwardProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<DialogTitle
		v-bind="forwardedProps"
		:class="twMerge('text-lg font-semibold leading-none tracking-tight', props.class)"
	>
		<slot />
	</DialogTitle>
</template>
