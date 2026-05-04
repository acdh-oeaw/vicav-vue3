<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { NavigationMenuViewport, type NavigationMenuViewportProps, useForwardProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<div class="absolute top-full left-0 isolate z-50 flex w-full justify-start">
		<NavigationMenuViewport
			v-bind="forwardedProps"
			:class="
				twMerge(
					'origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--reka-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--reka-navigation-menu-viewport-width)] left-[var(--reka-navigation-menu-viewport-left)]',
					props.class,
				)
			"
			data-slot="navigation-menu-viewport"
		/>
	</div>
</template>
