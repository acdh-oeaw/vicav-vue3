<script setup lang="ts">
import { AccordionContent, type AccordionContentProps } from "radix-vue";

const props = withDefaults(defineProps<AccordionContentProps>(), {});
</script>

<template>
	<AccordionContent
		v-bind="props"
		class="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
	>
		<div class="pb-4 pt-0" :class="$attrs.class">
			<slot />
		</div>
	</AccordionContent>
</template>
