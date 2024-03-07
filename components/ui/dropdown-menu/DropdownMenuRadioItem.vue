<script setup lang="ts">
import { Circle } from "lucide-vue-next";
import {
	DropdownMenuItemIndicator,
	DropdownMenuRadioItem,
	type DropdownMenuRadioItemEmits,
	type DropdownMenuRadioItemProps,
	useEmitAsProps,
} from "radix-vue";

const props = defineProps<DropdownMenuRadioItemProps>();

const emits = defineEmits<DropdownMenuRadioItemEmits>();

const emitAsProps = useEmitAsProps(emits);
</script>

<template>
	<DropdownMenuRadioItem
		v-bind="{ ...props, ...emitAsProps }"
		:class="[
			'focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			$attrs.class,
		]"
	>
		<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuItemIndicator>
				<Circle class="h-2 w-2 fill-current" />
			</DropdownMenuItemIndicator>
		</span>
		<slot />
	</DropdownMenuRadioItem>
</template>
