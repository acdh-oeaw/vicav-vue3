<script setup lang="ts">
import { ChevronUp } from "lucide-vue-next";
import { SelectScrollUpButton, type SelectScrollUpButtonProps } from "radix-vue";

const props = defineProps<SelectScrollUpButtonProps>();
</script>

<template>
	<SelectScrollUpButton
		v-bind="props"
		:class="['flex cursor-default items-center justify-center py-1', $attrs.class]"
	>
		<slot>
			<ChevronUp class="h-4 w-4" />
		</slot>
	</SelectScrollUpButton>
</template>
