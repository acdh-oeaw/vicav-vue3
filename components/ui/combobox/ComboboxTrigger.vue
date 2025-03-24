<script setup lang="ts">
import { ComboboxTrigger, type ComboboxTriggerProps, useForwardProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<ComboboxTriggerProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
	<ComboboxTrigger v-bind="forwarded" :class="twMerge('', props.class)" tabindex="0">
		<slot />
	</ComboboxTrigger>
</template>
