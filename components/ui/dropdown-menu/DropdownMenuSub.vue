<script setup lang="ts">
import {
	DropdownMenuSub,
	type DropdownMenuSubEmits,
	type DropdownMenuSubProps,
	useEmitAsProps,
} from "radix-vue";

const props = defineProps<DropdownMenuSubProps>();
const emits = defineEmits<DropdownMenuSubEmits>();

const emitAsProps = useEmitAsProps(emits);
</script>

<template>
	<DropdownMenuSub v-bind="{ ...props, ...emitAsProps }">
		<slot />
	</DropdownMenuSub>
</template>
