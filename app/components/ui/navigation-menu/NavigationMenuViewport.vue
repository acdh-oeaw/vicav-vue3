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
					'origin-top bg-popover text-popover-foreground relative mt-1.5 h-(--reka-navigation-menu-viewport-height) w-full overflow-hidden rounded-md border shadow-sm left-(--reka-navigation-menu-viewport-left) md:w-(--reka-navigation-menu-viewport-width) data-[state=open]:animate-in data-[state=open]:zoom-in-90 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95',
					props.class,
				)
			"
			data-slot="navigation-menu-viewport"
		/>
	</div>
</template>
