<script setup lang="ts">
type SelectorType = "color" | "icon";
export interface SelectionEntry {
	colorCode?: string;
	iconName?: string;
	id: string;
}
const props = withDefaults(
	defineProps<{
		type?: Array<SelectorType>;
		iconCategories?: Array<string>;
		modelValue: SelectionEntry;
	}>(),
	{
		type: () => ["color", "icon"] as Array<SelectorType>,
	},
);

const emit = defineEmits(["update:modelValue"]);
function updateColor(event: Event) {
	//@ts-expect-error target.value not recognized
	emit("update:modelValue", { ...props.modelValue, colorCode: event.target?.value ?? "" });
}
function updateIcon(iconName: string) {
	emit("update:modelValue", { ...props.modelValue, iconName });
}
</script>

<template>
	<label
		v-if="props.type?.includes('color')"
		class="ml-3 flex grow-0 basis-0 items-center self-center p-0"
		@click.capture.stop
	>
		<div
			class="size-4 rounded"
			:style="{
				backgroundColor: `var(--${modelValue.id})`,
				stroke: `var(--${modelValue.id})`,
			}"
		></div>
		<input
			class="size-0"
			type="color"
			:value="modelValue.colorCode || '#cccccc'"
			@click.capture.stop
			@input="updateColor"
		/>
		<span class="sr-only">Select color</span>
	</label>

	<div v-if="props.type?.includes('icon')">
		<IconPicker
			:limit-to-categories="iconCategories"
			:model-value="modelValue.iconName"
			@update:model-value="updateIcon"
		></IconPicker>
	</div>
</template>
