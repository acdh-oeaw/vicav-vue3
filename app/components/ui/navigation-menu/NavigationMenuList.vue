<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { NavigationMenuList, type NavigationMenuListProps, useForwardProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

const props = defineProps<NavigationMenuListProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<NavigationMenuList
		v-bind="forwardedProps"
		:class="twMerge('group flex flex-1 list-none items-center justify-center gap-1', props.class)"
		data-slot="navigation-menu-list"
	>
		<slot />
	</NavigationMenuList>
</template>
