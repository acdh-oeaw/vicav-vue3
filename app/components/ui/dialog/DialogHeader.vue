<script setup lang="ts">
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes, normalizeClass } from "vue";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<div
		:class="
			twMerge('flex flex-col gap-y-1.5 text-center sm:text-left', normalizeClass(props.class))
		"
	>
		<slot />
	</div>
</template>
