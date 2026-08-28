<script lang="ts" setup>
import { ToastAction, type ToastActionProps } from "radix-vue";

const props = defineProps<ToastActionProps>();
</script>

<template>
	<ToastAction
		v-bind="props"
		class="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary hover:group-[data-variant=negative]:border-negative/30 hover:group-[data-variant=negative]:bg-negative hover:group-[data-variant=negative]:text-on-negative focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden focus:group-[data-variant=negative]:ring-negative disabled:pointer-events-none disabled:opacity-50 group-[data-variant=negative]:border-muted/40"
	>
		<slot />
	</ToastAction>
</template>
