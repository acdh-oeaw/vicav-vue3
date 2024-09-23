<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { SelectIcon, SelectTrigger, type SelectTriggerProps } from "radix-vue";

const props = defineProps<SelectTriggerProps>();
</script>

<template>
	<SelectTrigger
		v-bind="props"
		:class="[
			'placeholder:text-muted-foreground flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
			$attrs.class,
		]"
	>
		<slot />
		<SelectIcon as-child>
			<ChevronDown class="size-4 opacity-50" />
		</SelectIcon>
	</SelectTrigger>
</template>
