<script setup lang="ts">
import { Primitive, type PrimitiveProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

interface Props extends PrimitiveProps {
	class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
	as: "div",
});
</script>

<template>
	<Primitive :as="as" :as-child="asChild" :class="twMerge('p-6 pt-0', props.class)">
		<slot />
	</Primitive>
</template>
