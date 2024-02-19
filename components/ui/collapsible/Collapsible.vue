<script setup lang="ts">
import {
	CollapsibleRoot,
	type CollapsibleRootEmits,
	type CollapsibleRootProps,
	useEmitAsProps,
} from "radix-vue";

const props = defineProps<CollapsibleRootProps>();
const emit = defineEmits<CollapsibleRootEmits>();

const emitAsProps = useEmitAsProps(emit);
</script>

<template>
	<CollapsibleRoot v-slot="{ open }" v-bind="{ ...props, ...emitAsProps }">
		<slot :open="open" />
	</CollapsibleRoot>
</template>
