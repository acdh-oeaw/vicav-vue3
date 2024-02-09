<script setup lang="ts">
import { AccordionContent, type AccordionContentProps } from "radix-vue";

const props = withDefaults(defineProps<AccordionContentProps>(), {});
</script>

<template>
	<AccordionContent
		v-bind="props"
		class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm transition-all"
	>
		<div class="pb-4 pt-0" :class="$attrs.class">
			<slot />
		</div>
	</AccordionContent>
</template>
