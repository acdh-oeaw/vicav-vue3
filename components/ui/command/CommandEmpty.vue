<script setup lang="ts">
import { Primitive, type PrimitiveProps } from "reka-ui";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

import { useCommand } from ".";

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const { filterState } = useCommand();
const isRender = computed(() => Boolean(filterState.search) && filterState.filtered.count === 0);
</script>

<template>
	<Primitive
		v-if="isRender"
		v-bind="delegatedProps"
		:class="twMerge('py-6 text-center text-sm', props.class)"
	>
		<slot />
	</Primitive>
</template>
