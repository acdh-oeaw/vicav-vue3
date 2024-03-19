<script setup lang="ts">
import { AccordionItem, type AccordionItemProps } from "radix-vue";

const props = withDefaults(defineProps<AccordionItemProps>(), {});
</script>

<template>
	<AccordionItem v-bind="props" class="border-b" :class="$attrs.class">
		<slot />
	</AccordionItem>
</template>
