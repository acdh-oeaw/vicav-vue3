<script setup lang="ts">
import { DialogDescription, type DialogDescriptionProps, useForwardProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<DialogDescription
		v-bind="forwardedProps"
		:class="twMerge('text-sm text-muted-foreground', props.class)"
	>
		<slot />
	</DialogDescription>
</template>
