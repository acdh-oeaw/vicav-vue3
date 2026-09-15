<script setup lang="ts">
import { ComboboxAnchor, type ComboboxAnchorProps, useForwardProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes, normalizeClass } from "vue";

const props = defineProps<ComboboxAnchorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
	<ComboboxAnchor v-bind="forwarded" :class="twMerge('w-[200px]', normalizeClass(props.class))">
		<slot />
	</ComboboxAnchor>
</template>
