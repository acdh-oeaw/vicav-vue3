<script setup lang="ts">
import { SelectSeparator, type SelectSeparatorProps } from "radix-vue";

const props = defineProps<SelectSeparatorProps>();
</script>

<template>
	<SelectSeparator v-bind="props" :class="['-mx-1 my-1 h-px bg-muted', $attrs.class]" />
</template>
