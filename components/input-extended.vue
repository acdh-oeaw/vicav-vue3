<script setup lang="ts">
const props = defineProps({
	modelValue: { type: String, default: "" },
	selectValue: { type: String },
	buttonLabels: { type: Array<string>, default: [] },
	selectOptions: { type: Map<string, string>, default: new Map([]) },
	placeholder: { type: String, default: "" },
	submitButtonLabel: { type: String },
});
const emit = defineEmits(["update:modelValue", "update:selectValue", "submit"]);

const inputElement = ref();

const myString = ref(`${props.modelValue}`);
watch(
	() => props.modelValue,
	(val) => {
		myString.value = val;
	},
);
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

const mySelectOption = ref(
	props.selectOptions.has(String(props.selectValue))
		? String(props.selectValue)
		: props.selectOptions.size > 0
		? props.selectOptions.keys().next().value
		: undefined,
);
watch(
	mySelectOption,
	(val) => {
		emit("update:selectValue", val);
	},
	{ immediate: true },
);
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname -->
	<div class="ie">
		<div class="ie-buttons">
			<button
				v-for="(c, i) in buttonLabels"
				:key="i"
				@click.prevent="InsertSnippet(c)"
				v-text="c"
			></button>
		</div>
		<div class="ie-input-row">
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
			<div v-if="selectOptions.size > 0" class="ie-select">
				<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
				<select v-model="mySelectOption">
					<option v-for="([key, value], i) in props.selectOptions" :key="i" :value="key">
						{{ value }}
					</option>
				</select>
			</div>
			<div v-if="!!props.submitButtonLabel" class="ie-submit">
				<button type="button" @click.prevent="submit">{{ props.submitButtonLabel }}</button>
			</div>
		</div>
	</div>
</template>
