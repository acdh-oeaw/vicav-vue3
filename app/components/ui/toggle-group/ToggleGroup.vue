<script setup lang="ts">
import {
	ToggleGroupRoot,
	type ToggleGroupRootEmits,
	type ToggleGroupRootProps,
	useForwardPropsEmits,
} from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

import { type ToggleGroupVariants, toggleGroupVariants } from "./index.ts";

const props = withDefaults(
	defineProps<
		ToggleGroupRootProps & {
			class?: HTMLAttributes["class"];
			variant?: ToggleGroupVariants["variant"];
		}
	>(),
	{
		variant: "default",
	},
);

const emits = defineEmits<ToggleGroupRootEmits>();

const delegatedProps = computed(() => {
	const { class: _, variant: _variant, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<ToggleGroupRoot
		v-bind="forwarded"
		:class="twMerge(toggleGroupVariants({ variant }), props.class)"
	>
		<slot />
	</ToggleGroupRoot>
</template>
