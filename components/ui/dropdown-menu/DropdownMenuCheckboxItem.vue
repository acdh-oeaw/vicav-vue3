<script setup lang="ts">
import { Check } from "lucide-vue-next";
import {
	DropdownMenuCheckboxItem,
	type DropdownMenuCheckboxItemEmits,
	type DropdownMenuCheckboxItemProps,
	DropdownMenuItemIndicator,
	useEmitAsProps,
} from "radix-vue";

const props = defineProps<DropdownMenuCheckboxItemProps>();
const emits = defineEmits<DropdownMenuCheckboxItemEmits>();

const emitAsProps = useEmitAsProps(emits);
</script>

<template>
	<DropdownMenuCheckboxItem
		v-bind="{ ...props, ...emitAsProps }"
		:class="[
			'focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			$attrs.class,
		]"
	>
		<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuItemIndicator>
				<Check class="h-4 w-4" />
			</DropdownMenuItemIndicator>
		</span>
		<slot />
	</DropdownMenuCheckboxItem>
</template>
