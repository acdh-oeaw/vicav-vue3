<script setup lang="ts">
defineProps<{
	parts: Array<string>;
	count?: number;
}>();
</script>

<template>
	<span
		><span v-for="(part, idx) in parts" :key="part"
			>{{ part
			}}<span v-if="idx < parts.length - 1" class="font-mono font-semibold"
				>&nbsp;and&nbsp;</span
			> </span
		><span v-if="count !== undefined"> ({{ count }})</span></span
	>
</template>
