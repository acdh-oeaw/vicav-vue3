<script setup lang="ts">
import type { SpecialCharacters } from "@/lib/api-client";

const props = defineProps<{
	modelValue: string;
	specialCharacters: SpecialCharacters;
	placeholder: string;
}>();
const emit = defineEmits(["update:modelValue", "submit"]);

const inputElement = ref();

const myString = ref(`${props.modelValue}`);
watch(myString, (val) => {
	emit("update:modelValue", val);
});
const submit = () => {
	emit("submit", myString);
};

const InsertSnippet = async (snippet: string): Promise<void> => {
	if (typeof inputElement.value.selectionStart !== "undefined") {
		let cursorPosition = Number(inputElement.value.selectionStart);
		myString.value =
			myString.value.substring(0, cursorPosition) +
			snippet +
			myString.value.substring(cursorPosition, myString.value.length);
		cursorPosition += snippet.length;
		await nextTick();
		restoreCursorPosition(cursorPosition);
	}
};

const restoreCursorPosition = (pos: number) => {
	if (typeof inputElement.value.createTextRange !== "undefined") {
		const range = inputElement.value.createTextRange();
		range.move("character", pos);
		range.select();
	} else if (typeof inputElement.value.setSelectionRange !== "undefined") {
		inputElement.value.focus();
		inputElement.value.setSelectionRange(pos, pos);
	} else if (typeof inputElement.value.selectionStart !== "undefined") {
		inputElement.value.focus();
		inputElement.value.selectionStart = pos;
		inputElement.value.selectionEnd = pos;
	}
};
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname -->
	<div class="ie">
		<div class="ie-buttons">
			<!-- @ts-expect-error  -->
			<button
				v-for="(c, i) in specialCharacters"
				:key="i"
				@click.prevent="InsertSnippet(c.value)"
				v-html="c.text ? c.text : c.value"
			></button>
		</div>
		<div class="ie-textinput">
			<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
			<input
				ref="inputElement"
				v-model="myString"
				:placeholder="placeholder"
				type="text"
				@keydown.enter.prevent="submit"
			/>
		</div>
	</div>
</template>

<style>
/* InputExtended stylesheet */
.ie button {
	@apply border-gray-300 bg-gray-200 border px-2 py-px font-bold text-gray-800 hover:bg-gray-300 rounded-sm m-px;
}

.ie input {
	@apply my-2 border px-3 py-2 w-full shadow;
}
</style>
