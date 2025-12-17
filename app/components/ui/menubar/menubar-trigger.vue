<script setup lang="ts">
import { MenubarTrigger, type MenubarTriggerProps } from "radix-vue";

const props = defineProps<MenubarTriggerProps>();
</script>

<template>
	<MenubarTrigger
		v-bind="props"
		class="flex cursor-default items-center rounded-sm px-3 py-1.5 text-sm font-medium select-none focus-visible:bg-accent focus-visible:text-on-accent focus-visible:outline-hidden data-[state=open]:bg-accent data-[state=open]:text-on-accent"
	>
		<slot />
	</MenubarTrigger>
</template>
