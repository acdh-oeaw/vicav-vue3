<script setup lang="ts">
const myString = ref("");

const specialCharacters: Array<string> = [
	"ē",
	"ṛ",
	"ṯ",
	"ẓ",
	"ū",
	"ī",
	"ō",
	"ā",
	"š",
	"ḏ",
	"ṭ",
	"ǧ",
	"ḥ",
	"ž",
	"ṣ",
	"ḏ̣",
	"ʕ",
	"ʔ",
	"ġ",
	"ḅ",
	"ṃ",
];
</script>

<template>
	<div>
		<div>
			<InputExtended v-model="myString" :string-snippets="specialCharacters" />
		</div>
		<div>
			{{ myString }}
		</div>
	</div>
</template>

<style>
.ei button {
	@apply bg-gray-300 px-4 py-2 font-bold text-gray-800 hover:bg-gray-400;
}

.ei input {
	@apply m-2 border px-3 py-2 shadow;
}
</style>
