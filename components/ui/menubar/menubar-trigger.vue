<script setup lang="ts">
import { MenubarTrigger, type MenubarTriggerProps } from "radix-vue";

const props = defineProps<MenubarTriggerProps>();
</script>

<template>
	<MenubarTrigger
		v-bind="props"
		class="flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium focus-visible:bg-accent focus-visible:text-on-accent focus-visible:outline-none data-[state=open]:bg-accent data-[state=open]:text-on-accent"
	>
		<slot />
	</MenubarTrigger>
</template>
