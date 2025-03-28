<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { SelectItem, SelectItemIndicator, type SelectItemProps, SelectItemText } from "radix-vue";

const props = defineProps<SelectItemProps>();
</script>

<template>
	<SelectItem
		v-bind="props"
		:class="[
			'focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
			$attrs.class,
		]"
	>
		<span class="flex size-3.5 items-center justify-end px-1">
			<SelectItemIndicator>
				<Check class="size-4" />
			</SelectItemIndicator>
		</span>

		<SelectItemText>
			<slot />
		</SelectItemText>
	</SelectItem>
</template>
