<script setup lang="ts">
import { Primitive, type PrimitiveProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes, normalizeClass } from "vue";

interface Props extends PrimitiveProps {
	variant?: "default" | "destructive";
	class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
	as: "div",
	variant: "default",
});
</script>

<template>
	<Primitive
		:as="as"
		:as-child="asChild"
		:class="
			twMerge(
				'bg-background text-foreground relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[--spacing(4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
				props.variant === 'destructive' &&
					'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-current',
				normalizeClass(props.class),
			)
		"
		:role="props.variant === 'destructive' ? 'alert' : undefined"
	>
		<slot />
	</Primitive>
</template>
