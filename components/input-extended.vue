<script setup lang="ts">
const props = defineProps({
	modelValue: String,
	stringSnippets: Array<string>,
	placeholder: String,
});
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
		let selectionStart = Number(inputElement.value.selectionStart),
			selectionEnd = Number(inputElement.value.selectionEnd);
		myString.value =
			myString.value.substring(0, selectionStart) +
			snippet +
			myString.value.substring(selectionEnd, myString.value.length);
		await nextTick();
		restoreCursorPosition(selectionStart + snippet.length);
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
			<input
				ref="inputElement"
				v-model="myString"
				type="text"
				:placeholder="placeholder"
				@keydown.enter.prevent="submit"
			/>
		</div>
	</div>
</template>
