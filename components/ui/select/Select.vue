<script setup lang="ts">
import {
	type SelectRoot,
	type SelectRootEmits,
	type SelectRootProps,
	useEmitAsProps,
} from "radix-vue";

const props = defineProps<SelectRootProps>();
const emits = defineEmits<SelectRootEmits>();

const emitAsProps = useEmitAsProps(emits);
</script>

<template>
	<SelectRoot v-bind="{ ...props, ...emitAsProps }">
		<slot />
	</SelectRoot>
</template>
