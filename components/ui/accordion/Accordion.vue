<script setup lang="ts">
import {
	AccordionRoot,
	type AccordionRootEmits,
	type AccordionRootProps,
	useEmitAsProps,
} from "radix-vue";

const props = defineProps<AccordionRootProps>();
const emits = defineEmits<AccordionRootEmits>();

const emitAsProps = useEmitAsProps(emits);
</script>

<template>
	<AccordionRoot v-bind="{ ...props, ...emitAsProps }">
		<slot />
	</AccordionRoot>
</template>
