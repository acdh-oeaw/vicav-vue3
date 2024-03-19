<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { SelectScrollDownButton, type SelectScrollDownButtonProps } from "radix-vue";

const props = defineProps<SelectScrollDownButtonProps>();
</script>

<template>
	<SelectScrollDownButton
		v-bind="props"
		:class="['flex cursor-default items-center justify-center py-1', $attrs.class]"
	>
		<slot>
			<ChevronDown class="h-4 w-4" />
		</slot>
	</SelectScrollDownButton>
</template>
