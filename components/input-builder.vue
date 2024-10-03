<script setup lang="ts">
import type { SpecialCharacters } from "@/lib/api-client";

const props = withDefaults(
	defineProps<{
		modelValue: string;
		selectValue?: string;
		specialCharacters: SpecialCharacters;
		selectOptions?: Map<string, string>;
		placeholder?: string;
		submitButtonLabel?: string;
	}>(),
	{
		selectValue: "",
		selectOptions: () => new Map<string, string>([]),
		placeholder: "",
		submitButtonLabel: "",
	},
);
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
		const selectionStart = Number(inputElement.value.selectionStart),
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
watch(
	() => props.selectValue,
	(val) => {
		if (props.selectOptions.has(String(val))) {
			mySelectOption.value = val;
		}
	},
);
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname -->
	<div class="ib">
		<div class="ib-buttons">
			<button
				v-for="(c, i) in specialCharacters"
				:key="i"
				@click.prevent="InsertSnippet(c.value)"
				v-html="c.text ? c.text : c.value"
			></button>
		</div>
		<div class="ib-input-row">
			<div class="ib-textinput">
				<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
				<input
					ref="inputElement"
					v-model="myString"
					:placeholder="placeholder"
					type="text"
					@keydown.enter.prevent="submit"
				/>
			</div>
			<div v-if="selectOptions.size > 0" class="ib-select">
				<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
				<select v-model="mySelectOption">
					<option v-for="([key, value], i) in props.selectOptions" :key="i" :value="key">
						{{ value }}
					</option>
				</select>
			</div>
			<div v-if="!!props.submitButtonLabel" class="ib-submit">
				<button type="button" @click.prevent="submit">{{ props.submitButtonLabel }}</button>
			</div>
		</div>
	</div>
</template>
