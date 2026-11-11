<script setup lang="ts">
import {
	ComboboxItem,
	type ComboboxItemEmits,
	type ComboboxItemProps,
	useForwardPropsEmits,
} from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes, normalizeClass } from "vue";

const props = defineProps<ComboboxItemProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<ComboboxItemEmits>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<ComboboxItem
		v-bind="forwarded"
		:class="
			twMerge(
				'relative flex cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0',
				normalizeClass(props.class),
			)
		"
	>
		<slot />
	</ComboboxItem>
</template>
