<script lang="ts" setup>
import { XIcon } from "lucide-vue-next";
import { ToastClose, type ToastCloseProps } from "radix-vue";

const props = defineProps<ToastCloseProps>();
</script>

<template>
	<ToastClose
		v-bind="props"
		class="absolute right-2 top-2 rounded-md p-1 text-on-background/50 opacity-0 transition hover:text-on-background focus-visible:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 group-hover:opacity-100 group-[data-variant=negative]:text-red-300 hover:group-[data-variant=negative]:text-red-50 focus-visible:group-[data-variant=negative]:ring-red-400 focus-visible:group-[data-variant=negative]:ring-offset-red-600"
	>
		<XIcon class-name="h-4 w-4" />
	</ToastClose>
</template>
