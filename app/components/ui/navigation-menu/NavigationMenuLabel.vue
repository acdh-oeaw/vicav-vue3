<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import {
	NavigationMenuLink,
	type NavigationMenuLinkEmits,
	type NavigationMenuLinkProps,
	useForwardPropsEmits,
} from "reka-ui";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
	defineProps<NavigationMenuLinkProps & { class?: HTMLAttributes["class"] }>(),
	{
		as: "span",
	},
);
const emits = defineEmits<NavigationMenuLinkEmits>();

const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<NavigationMenuLink
		v-bind="forwarded"
		:class="
			twMerge(
				'font-semibold data-active:text-accent-foreground hover:text-accent-foreground focus:text-accent-foreground ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 [&_svg:not([class*=\'text-\'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 [&_svg:not([class*=\'size-\'])]:size-4',
				props.class,
			)
		"
		data-slot="navigation-menu-link"
	>
		<slot />
	</NavigationMenuLink>
</template>
