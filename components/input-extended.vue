<script setup lang="ts">
defineProps({
	modelValue: String,
	stringSnippets: Array<string>,
});
const emit = defineEmits(["update:modelValue"]);

const inputElement = ref();

const myString = ref("");
watch(myString, (val) => {
	emit("update:modelValue", val);
});

let cursorPosition = 0;
const InsertSnippet = async (snippet: string): Promise<void> => {
	myString.value =
		myString.value.substring(0, cursorPosition) +
		snippet +
		myString.value.substring(cursorPosition, myString.value.length);
	cursorPosition += snippet.length;
	await nextTick();
	setCursorPosition(cursorPosition);
};

const setCursorPosition = (pos: number) => {
	if (typeof inputElement.value.createTextRange !== "undefined") {
		var range = inputElement.value.createTextRange();
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

const recordCursorPosition = (e: Event) => {
	cursorPosition = Number((e.target as HTMLInputElement).selectionStart);
};
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname -->
	<div class="ei">
		<div class="ei-buttons">
			<button
				v-for="(c, i) in stringSnippets"
				:key="i"
				@click="InsertSnippet(c)"
				v-text="c"
			></button>
		</div>
		<div class="ei-textinput">
			<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
			<input
				ref="inputElement"
				v-model="myString"
				type="text"
				@keyup="recordCursorPosition"
				@click="recordCursorPosition"
			/>
		</div>
	</div>
</template>
