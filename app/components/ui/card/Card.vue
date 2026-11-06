<script setup lang="ts">
import { Primitive, type PrimitiveProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes, normalizeClass } from "vue";

interface Props extends PrimitiveProps {
	class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
	as: "div",
});
</script>

<template>
	<Primitive
		:as="as"
		:as-child="asChild"
		:class="
			twMerge(
				'rounded-xl border bg-card text-card-foreground shadow-sm',
				normalizeClass(props.class),
			)
		"
	>
		<slot />
	</Primitive>
</template>
