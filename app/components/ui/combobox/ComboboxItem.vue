<script setup lang="ts">
import {
	ComboboxItem,
	type ComboboxItemEmits,
	type ComboboxItemProps,
	useForwardPropsEmits,
} from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

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
				'relative flex cursor-default gap-2 select-none justify-between items-center rounded-sm px-2 py-1.5 text-sm outline-hidden data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
				props.class,
			)
		"
	>
		<slot />
	</ComboboxItem>
</template>
