<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import {
	NavigationMenuRoot,
	type NavigationMenuRootEmits,
	type NavigationMenuRootProps,
	type NavigationMenuViewportProps,
	useForwardPropsEmits,
} from "reka-ui";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

import NavigationMenuViewport from "./NavigationMenuViewport.vue";

const props = withDefaults(
	defineProps<
		NavigationMenuRootProps & {
			class?: HTMLAttributes["class"];
			viewport?: boolean;
			align?: NavigationMenuViewportProps["align"];
		}
	>(),
	{
		viewport: true,
		align: "start",
	},
);
const emits = defineEmits<NavigationMenuRootEmits>();

const delegatedProps = reactiveOmit(props, "class", "viewport");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<NavigationMenuRoot
		v-slot="slotProps"
		v-bind="forwarded"
		:class="
			twMerge(
				'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
				props.class,
			)
		"
		data-slot="navigation-menu"
		:data-viewport="viewport"
	>
		<slot v-bind="slotProps" />
		<NavigationMenuViewport v-if="viewport" :align="props.align" />
	</NavigationMenuRoot>
</template>
