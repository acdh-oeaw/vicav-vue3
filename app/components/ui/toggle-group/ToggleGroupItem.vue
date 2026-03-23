<script setup lang="ts">
import { ToggleGroupItem as ToggleGroupItemPrimitive, type ToggleGroupItemProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

import { type ToggleVariants, toggleVariants } from "../toggle/index.ts";

const props = withDefaults(
	defineProps<
		ToggleGroupItemProps & {
			class?: HTMLAttributes["class"];
			variant?: ToggleVariants["variant"];
			size?: ToggleVariants["size"];
		}
	>(),
	{
		variant: "default",
		size: "default",
	},
);

const delegatedProps = computed(() => {
	const { class: _, size: _size, variant: _variant, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<ToggleGroupItemPrimitive
		v-bind="delegatedProps"
		:class="twMerge(toggleVariants({ variant, size }), props.class)"
	>
		<slot />
	</ToggleGroupItemPrimitive>
</template>
