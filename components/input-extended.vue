<script setup lang="ts">
defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const inputElement = ref();

const myString = ref("");
watch(myString, (val) => {
	emit("update:modelValue", val);
});

const specChars = [
	"&#x2019;",
	"&#x0294;",
	"&#x0101;",
	"&#x1e05;",
	"&#x0295;",
	"&#x1e0f;",
	"&#x1e0f;&#x0323;",
	"&#x0113;",
	"&#x0121;",
	"&#x01e7;",
	"&#x1e25;",
	"&#x012b;",
	"&#x1d35;",
	"&#x1e37;",
	"&#x1e43;",
	"&#x014d;",
	"&#x1e5b;",
	"&#x1e63;",
	"&#x0073;&#x0320;",
	"&#x0161;",
	"&#x1e6d;",
	"&#x1e6f;",
	"&#x016b;",
	"&#x1e93;",
	"&#x017e;",
];

let cursorPosition = 0;
const InsertChar = async (htmlChar: string): Promise<void> => {
	let decodedChar = parseHtmlEntities(htmlChar);
	myString.value =
		myString.value.substring(0, cursorPosition) +
		decodedChar +
		myString.value.substring(cursorPosition, myString.value.length);
	cursorPosition += decodedChar.length;
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

function parseHtmlEntities(str: string) {
	return str.replace(/&#x([0-9a-f]{1,4});/gi, function (match, numStr) {
		var num = parseInt(numStr, 16);
		return String.fromCharCode(num);
	});
}

const registerCursorPosition = (e: Event) => {
	cursorPosition = Number((e.target as HTMLInputElement).selectionStart);
};
</script>

<template>
	<div>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<button
			v-for="(c, i) in specChars"
			:key="i"
			class="bg-gray-300 px-4 py-2 font-bold text-gray-800 hover:bg-gray-400"
			@click="InsertChar(c)"
			v-html="c"
		></button>
	</div>
	<div>
		<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
		<input
			ref="inputElement"
			v-model="myString"
			type="text"
			class="m-2 rounded border px-3 py-2 leading-tight shadow"
			@keyup="registerCursorPosition"
			@click="registerCursorPosition"
		/>
	</div>
</template>
