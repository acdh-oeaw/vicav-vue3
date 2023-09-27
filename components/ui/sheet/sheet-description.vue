<script setup lang="ts">
import { DialogDescription, type DialogDescriptionProps } from "radix-vue";

const props = defineProps<DialogDescriptionProps>();
</script>

<template>
	<DialogDescription v-bind="props" class="text-sm text-on-muted">
		<slot />
	</DialogDescription>
</template>
