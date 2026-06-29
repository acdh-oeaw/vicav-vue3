<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";
import { reactiveOmit } from "@vueuse/core";
import { NavigationMenuTrigger, type NavigationMenuTriggerProps, useForwardProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

import { navigationMenuTriggerStyle } from ".";

const props = defineProps<NavigationMenuTriggerProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<NavigationMenuTrigger
		v-bind="forwardedProps"
		:class="twMerge(navigationMenuTriggerStyle(), 'group', props.class)"
		data-slot="navigation-menu-trigger"
	>
		<slot />
		<ChevronDown
			aria-hidden="true"
			class="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
		/>
	</NavigationMenuTrigger>
</template>
