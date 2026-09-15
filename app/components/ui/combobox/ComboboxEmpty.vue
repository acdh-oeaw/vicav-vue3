<script setup lang="ts">
import { ComboboxEmpty, type ComboboxEmptyProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes, normalizeClass } from "vue";

const props = defineProps<ComboboxEmptyProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<ComboboxEmpty
		v-bind="delegatedProps"
		:class="twMerge('py-6 text-center text-sm', normalizeClass(props.class))"
	>
		<slot />
	</ComboboxEmpty>
</template>
