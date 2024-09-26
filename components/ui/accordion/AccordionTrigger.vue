<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { AccordionHeader, AccordionTrigger, type AccordionTriggerProps } from "radix-vue";

const props = withDefaults(defineProps<AccordionTriggerProps>(), {});
</script>

<template>
	<AccordionHeader class="flex">
		<AccordionTrigger
			v-bind="props"
			class="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180"
			:class="$attrs.class"
		>
			<slot />
			<slot name="icon">
				<ChevronDown class="size-4 shrink-0 transition-transform duration-200" />
			</slot>
		</AccordionTrigger>
	</AccordionHeader>
</template>
