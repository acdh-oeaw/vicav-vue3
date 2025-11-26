<script setup lang="ts">
import * as LucideIcons from "lucide-vue-next";
import type { SVGAttributes } from "vue";

const props = withDefaults(
	defineProps<{
		name: string;
		size?: number;
		color?: string;
		isCustomIcon?: boolean;
		additionalAttributes?: SVGAttributes;
	}>(),
	{ size: 20 },
);

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
	<svg v-if="isCustomIcon" :height="size" :width="size">
		<use :href="`#${name}`" v-bind="additionalAttributes"></use>
	</svg>
	<component :is="LucideIcon" v-else :color="color || 'currentColor'" :size="size" />
</template>
