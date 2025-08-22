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
		usePopoverModal?: boolean;
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

const localColor = ref(props.modelValue.colorCode ?? "#cccccc");
watch(
	() => localColor.value,
	(newColor) => {
		emit("update:modelValue", { ...props.modelValue, colorCode: newColor });
	},
);

const customIcons = [
	{
		name: "petal",
		categories: ["shapes"],
		tags: [],
		additionalAttributes: {
			"stroke-width": "40",
			height: "90%",
			y: "5%",
		},
	},
	{
		name: "circle-small",
		categories: ["shapes"],
		tags: [],
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
		:use-popover-modal="usePopoverModal"
		:use-popover-portal="usePopoverPortal"
		@update:color="updateColor"
		@update:icon="updateIcon"
	></IconPicker>
	<label
		v-else-if="props.type.includes('color')"
		class="flex grow-0 basis-0 items-center p-0"
		@click.capture.stop
	>
		<span class="mr-2 text-neutral-800 sr-only">Pick a marker color</span>
		<div
			class="size-4 rounded"
			:style="{
				backgroundColor: localColor,
				stroke: localColor,
			}"
		></div>
		<input v-model="localColor" class="size-0" type="color" @click.capture.stop />
		<span class="sr-only">Select color</span>
	</label>
</template>
