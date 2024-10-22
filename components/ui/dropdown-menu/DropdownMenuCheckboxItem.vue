<script setup lang="ts">
import { Check } from "lucide-vue-next";
import {
	DropdownMenuCheckboxItem,
	type DropdownMenuCheckboxItemEmits,
	type DropdownMenuCheckboxItemProps,
	DropdownMenuItemIndicator,
	useForwardPropsEmits,
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<DropdownMenuCheckboxItemProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<DropdownMenuCheckboxItemEmits>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<DropdownMenuCheckboxItem
		v-bind="forwarded"
		class="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
	>
		<span class="absolute left-2 flex size-3.5 items-center justify-center">
			<DropdownMenuItemIndicator>
				<Check class="size-4" />
			</DropdownMenuItemIndicator>
		</span>
		<slot />
	</DropdownMenuCheckboxItem>
</template>
