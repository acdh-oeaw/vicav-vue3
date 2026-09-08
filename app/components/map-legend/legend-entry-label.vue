<script setup lang="ts">
defineProps<{
	parts: Array<string>;
	count?: number;
	/** feature the value belongs to, shown where values of several features sit side by side */
	featureLabel?: string;
}>();
</script>

<template>
	<span
		><span v-if="featureLabel" class="text-on-muted">{{ featureLabel }}:&nbsp;</span
		><span v-for="(part, idx) in parts" :key="part"
			>{{ part
			}}<span v-if="idx < parts.length - 1" class="font-mono font-semibold"
				>&nbsp;and&nbsp;</span
			> </span
		><span v-if="count !== undefined"> ({{ count }})</span></span
	>
</template>
