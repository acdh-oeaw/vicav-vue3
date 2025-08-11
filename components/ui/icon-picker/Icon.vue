<script setup lang="ts">
import * as LucideIcons from "lucide-vue-next";

const props = defineProps<{
	name: string;
	size?: number;
	color?: string;
}>();

const camelCasedIconName = computed(() => {
	const name = props.name
		.toLowerCase()
		.replace(/([-_][a-z0-9])/g, (group) => group.toUpperCase().replace("-", "").replace("_", ""));
	return name.charAt(0).toUpperCase() + name.slice(1);
});

const LucideIcon = computed(() => {
	const foundIcon = (LucideIcons as Record<string, unknown>)[camelCasedIconName.value];
	return foundIcon;
});
</script>

<template>
	<component :is="LucideIcon" :color="color || 'currentColor'" :size="size || 20" />
</template>
