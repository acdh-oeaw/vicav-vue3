<script setup lang="ts">
defineProps({
	modelValue: String,
	stringSnippets: Array<string>,
	placeholder: String,
});
const emit = defineEmits(["update:modelValue"]);

const inputElement = ref();

const myString = ref("");
watch(myString, (val) => {
	emit("update:modelValue", val);
});

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
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname -->
	<div class="ie">
		<div class="ie-buttons">
			<button
				v-for="(c, i) in stringSnippets"
				:key="i"
				@click.prevent="InsertSnippet(c)"
				v-text="c"
			></button>
		</div>
		<div class="ie-textinput">
			<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
			<input ref="inputElement" v-model="myString" type="text" :placeholder="placeholder" />
		</div>
	</div>
</template>
