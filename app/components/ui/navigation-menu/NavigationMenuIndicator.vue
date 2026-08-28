<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import {
	NavigationMenuIndicator,
	type NavigationMenuIndicatorProps,
	useForwardProps,
} from "reka-ui";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

const props = defineProps<NavigationMenuIndicatorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<NavigationMenuIndicator
		v-bind="forwardedProps"
		:class="
			twMerge(
				'top-full z-1 flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=visible]:fade-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out',
				props.class,
			)
		"
		data-slot="navigation-menu-indicator"
	>
		<div class="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
	</NavigationMenuIndicator>
</template>
