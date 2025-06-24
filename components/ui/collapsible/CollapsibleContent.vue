<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from "radix-vue";
import { twMerge } from "tailwind-merge";

const props = withDefaults(
	defineProps<CollapsibleContentProps & { orientation?: "horizontal" | "vertical" }>(),
	{ orientation: "vertical" },
);
const animationClasses = {
	horizontal:
		"data-[state=closed]:animate-collapsible-left data-[state=open]:animate-collapsible-right",
	vertical: "data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
};
</script>

<template>
	<CollapsibleContent
		v-bind="props"
		:class="twMerge('overflow-hidden transition-all ', animationClasses[props.orientation])"
	>
		<slot />
	</CollapsibleContent>
</template>
