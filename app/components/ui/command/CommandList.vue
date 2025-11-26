<script setup lang="ts">
import { ListboxContent, type ListboxContentProps, useForwardProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<ListboxContentProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
	<ListboxContent
		v-bind="forwarded"
		:class="twMerge('max-h-[300px] overflow-y-auto overflow-x-hidden', props.class)"
	>
		<div role="presentation">
			<slot />
		</div>
	</ListboxContent>
</template>
