<script lang="ts" setup>
// import {
// 	ComboboxAnchor,
// 	ComboboxContent,
// 	ComboboxEmpty,
// 	ComboboxGroup,
// 	ComboboxInput,
// 	ComboboxItem,
// 	ComboboxItemIndicator,
// 	ComboboxLabel,
// 	ComboboxRoot,
// 	ComboboxTrigger,
// 	ComboboxViewport,
// 	TagsInputInput,
// 	TagsInputItem,
// 	TagsInputItemDelete,
// 	TagsInputItemText,
// 	TagsInputRoot,
// } from "radix-vue";

import type { ExploreSamplesFormWindowItem } from "@/types/global.d";

interface Props {
	params: ExploreSamplesFormWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

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

const { simpleItems } = useTEIHeaders();
const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const place = ref();
const word = ref();

/**
 * Intercept anchor clicks to open window instead of navigating.
 */
const openSearchResultsWindow = function () {
	const persons = simpleItems.value
		.filter((item) => item.place.name === place.value)
		.map((item) => item.person.name);

	addWindow({
		targetType: "ExploreSamples",
		params: {
			dataType: params.value.dataTypes[0],
			word: word.value,
			person: persons.join(","),
		},
		title: `Search results for ${[word.value, place.value].join(", ")}`,
	} as WindowState);
};
</script>

<template>
	<div
		class="relative isolate grid h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<InputExtended v-model="place" aria-label="Place name" />
			<InputExtended
				v-model="word"
				:string-snippets="specialCharacters"
				placeholder="Search for word ..."
				aria-label="Word"
			/>
			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="word === ''"
				@click.prevent.stop="openSearchResultsWindow"
			>
				Query
			</button>
			<br />
		</form>
	</div>
</template>
