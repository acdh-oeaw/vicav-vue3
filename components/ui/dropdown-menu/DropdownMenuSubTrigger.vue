<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import { DropdownMenuSubTrigger, type DropdownMenuSubTriggerProps } from "radix-vue";

const props = defineProps<DropdownMenuSubTriggerProps>();
</script>

<template>
	<DropdownMenuSubTrigger
		v-bind="props"
		:class="[
			'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
			$attrs.class,
		]"
	>
		<slot />
		<ChevronRight class="ml-auto h-4 w-4" />
	</DropdownMenuSubTrigger>
</template>
