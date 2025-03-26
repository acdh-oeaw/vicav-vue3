<script setup lang="ts">
import { Separator, type SeparatorProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<SeparatorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<Separator v-bind="delegatedProps" :class="twMerge('-mx-1 h-px bg-border', props.class)">
		<slot />
	</Separator>
</template>
