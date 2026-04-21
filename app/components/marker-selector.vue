<script setup lang="ts">
import { useMarkerStore } from "@/stores/use-marker-store";

import type { IconType } from "./ui/icon-picker/IconPicker.vue";

type SelectorType = "color" | "icon";
export interface SelectionEntry {
	colorCode: string;
	icon: IconType;
	id: string;
	hidden?: boolean;
}
const props = withDefaults(
	defineProps<{
		type?: Array<SelectorType>;
		iconCategories?: Array<string>;
		modelValue: SelectionEntry;
		enableHideToggle?: boolean;
		usePopoverPortal?: boolean;
		usePopoverModal?: boolean;
	}>(),
	{
		enableHideToggle: true,
		type: () => ["color", "icon"] as Array<SelectorType>,
	},
);

const emit = defineEmits(["update:modelValue"]);
const {
	applyStyleToUnderlyingFeatureValues,
	generateColorVariantsForFeatureValues,
	hasUnderlyingFeatureValues,
} = useMarkerStore();

function updateColor(color: string) {
	emit("update:modelValue", { ...props.modelValue, colorCode: color });
}
function updateIcon(icon: IconType) {
	emit("update:modelValue", { ...props.modelValue, icon });
}
function updateHidden(hidden: boolean) {
	emit("update:modelValue", { ...props.modelValue, hidden });
}

function applyStyleToUnderlying(style: { colorCode: string; icon: IconType }) {
	applyStyleToUnderlyingFeatureValues(props.modelValue.id, style);
	emit("update:modelValue", { ...props.modelValue, ...style });
}

function generateColorVariants() {
	generateColorVariantsForFeatureValues(props.modelValue.id);
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
	...[
		"circle-small",
		"badge",
		"club",
		"cross",
		"diamond",
		"heart",
		"hexagon",
		"octagon",
		"pentagon",
		"rectangle-horizontal",
		"rectangle-vertical",
		"shield",
		"sparkle",
		"square",
		"squircle",
		"star",
		"triangle",
	].map(
		(iconName) =>
			({
				name: iconName!,
				categories: ["shapes"],
			}) as IconType,
	),
];
</script>

<template>
	<div class="flex items-center gap-1.5">
		<IconPicker
			v-if="props.type?.includes('icon')"
			:color="modelValue.colorCode"
			:custom-icons="customIcons"
			:enable-apply-to-underlying-feature-values="hasUnderlyingFeatureValues(modelValue.id)"
			:enable-hide-toggle="enableHideToggle"
			:hidden="modelValue.hidden"
			:icon="modelValue.icon"
			:limit-to-categories="iconCategories"
			search-placeholder="Search for an alternative icon..."
			:use-popover-modal="usePopoverModal"
			:use-popover-portal="usePopoverPortal"
			@apply-style-to-underlying="applyStyleToUnderlying"
			@generate-color-variants="generateColorVariants"
			@update:color="updateColor"
			@update:hidden="updateHidden"
			@update:icon="updateIcon"
		></IconPicker>
		<label
			v-else-if="props.type.includes('color')"
			class="flex grow-0 basis-0 items-center p-0"
			@click.capture.stop
		>
			<span class="sr-only mr-2 text-neutral-800">Pick a marker color</span>
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
	</div>
</template>
