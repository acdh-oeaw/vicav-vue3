<script setup lang="ts">
import { Primitive, type PrimitiveProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes, normalizeClass } from "vue";

interface Props extends PrimitiveProps {
	class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
	as: "h5",
});
</script>

<template>
	<Primitive
		:as="as"
		:as-child="asChild"
		:class="
			twMerge(
				'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
				normalizeClass(props.class),
			)
		"
	>
		<slot />
	</Primitive>
</template>
