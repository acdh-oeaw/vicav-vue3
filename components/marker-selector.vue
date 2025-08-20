<script setup lang="ts">
import type { IconType } from "./ui/icon-picker/IconPicker.vue";

type SelectorType = "color" | "icon";
export interface SelectionEntry {
	colorCode: string;
	icon: IconType;
	id: string;
}
const props = withDefaults(
	defineProps<{
		type?: Array<SelectorType>;
		iconCategories?: Array<string>;
		modelValue: SelectionEntry;
		usePopoverPortal?: boolean;
	}>(),
	{
		type: () => ["color", "icon"] as Array<SelectorType>,
	},
);

const emit = defineEmits(["update:modelValue"]);
function updateColor(color: string) {
	emit("update:modelValue", { ...props.modelValue, colorCode: color });
}
function updateIcon(icon: IconType) {
	emit("update:modelValue", { ...props.modelValue, icon });
}

const customIcons = [
	{
		name: "petal",
		categories: ["shapes"],
		tags: [],
		additionalAttributes: {
			// fill: "transparent",
			// stroke: "black",
			"stroke-width": "40",
			height: "90%",
			y: "5%",
		},
	},
];
</script>

<template>
	<IconPicker
		v-if="props.type?.includes('icon')"
		:id="modelValue.id"
		:color="modelValue.colorCode"
		:custom-icons="customIcons"
		:icon="modelValue.icon"
		:limit-to-categories="iconCategories"
		search-placeholder="Search for an alternative icon..."
		:use-popover-portal="usePopoverPortal"
		@update:color="updateColor"
		@update:icon="updateIcon"
	></IconPicker>
</template>
