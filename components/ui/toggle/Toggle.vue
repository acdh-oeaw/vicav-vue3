<script setup lang="ts">
import { Toggle, type ToggleEmits, type ToggleProps, useForwardPropsEmits } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

import { type ToggleVariants, toggleVariants } from ".";

const props = withDefaults(
	defineProps<
		ToggleProps & {
			class?: HTMLAttributes["class"];
			variant?: ToggleVariants["variant"];
			size?: ToggleVariants["size"];
		}
	>(),
	{
		variant: "default",
		size: "default",
		disabled: false,
	},
);

const emits = defineEmits<ToggleEmits>();

const delegatedProps = computed(() => {
	const { class: _, size: _size, variant: _variant, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<Toggle v-bind="forwarded" :class="twMerge(toggleVariants({ variant, size }), props.class)">
		<slot />
	</Toggle>
</template>
