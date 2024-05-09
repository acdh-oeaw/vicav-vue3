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

import { Icon } from "@iconify/vue";
import {
	CheckboxIndicator,
	CheckboxRoot,
	SliderRange,
	SliderRoot,
	SliderThumb,
	SliderTrack,
} from "radix-vue";

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

const place = ref("");
const word = ref("");
const feature = ref("");
const age = ref([0, 100]);
const male = ref(true);
const female = ref(true);
const comment = ref("");
const translation = ref("");
const persons = ref("");

const featureLabel = computed(() => {
	return props.params.dataTypes[0] === "SampleText" ? "sentence" : "feature";
});

const sex = computed(() => {
	let result = [];
	if (male.value) result.push("m");
	if (female.value) result.push("f");
	return result;
});
/**
 * Intercept anchor clicks to open window instead of navigating.
 */
const openSearchResultsWindow = function () {
	const personsFilter = simpleItems.value
		.filter((item) => {
			if (!params.value.dataTypes.includes(item.dataType)) return false;
			if (persons.value && persons.value.split(",").includes(item.person.name)) return true;

			let filters = [];
			if (place.value) {
				filters.push(item.place.name === place.value);
			}
			filters.push(item.person.age > age.value[0] && item.person.age < age.value[1]);
			if (sex.value.length > 0) {
				filters.push(sex.value.includes(item.person.sex));
			}
			return filters.includes(true);
		})
		.map((item) => item.person.name);

	addWindow({
		targetType: "ExploreSamples",
		params: {
			dataType: params.value.dataTypes[0],
			word: word.value,
			comment: comment.value,
			translation: translation.value,
			person: personsFilter.join(","),
		},
		title: `Search results for ${[word.value, place.value].join(", ")}`,
	} as WindowState);
};
</script>

<template>
	<div class="relative isolate grid h-full w-full overflow-auto">
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<div class="flex flex-row gap-2.5">
				<label class="font-bold" for="place">Place</label>
				<input
					id="place"
					v-model="place"
					:string-snippets="specialCharacters"
					aria-label="Place name"
					placeholder="Search for place..."
				/>
			</div>

			<div class="flex flex-row gap-2.5">
				<label class="" for="age">Age</label>
				<div class="my-2 flex flex-row px-3 py-2">
					<span>{{ age[0] }}</span>
					<SliderRoot
						v-model="age"
						class="relative mx-2 flex w-[200px] touch-none select-none items-center"
						:min="0"
						:max="100"
						:step="10"
					>
						<SliderTrack class="relative h-[3px] grow rounded-full bg-gray-400">
							<SliderRange class="absolute h-full rounded-full bg-primary" />
						</SliderTrack>
						<SliderThumb
							class="block h-5 w-5 rounded-[10px] bg-white shadow-[0_2px_10px] focus:shadow-[0_0_0_2px]"
							aria-label="Min age"
						/>
						<SliderThumb
							class="block h-5 w-5 rounded-[10px] bg-white shadow-[0_2px_10px] shadow-primary focus:shadow-[0_0_0_2px] focus:shadow-gray-400"
							aria-label="Max age"
						/>
					</SliderRoot>
					<span>{{ age[1] }}</span>
				</div>
			</div>
			<div class="flex flex-row gap-2.5">
				<label for="sex">Sex</label>
				<div class="flex flex-row gap-2.5">
					<label
						class="flex flex-row items-center gap-4 [&>.checkbox]:hover:bg-neutral-100"
						for="sex-male"
					>
						<CheckboxRoot
							v-model:checked="male"
							if="sex-male"
							class="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] shadow-gray-500 outline-none focus-within:shadow-[0_0_0_2px_gray]"
						>
							<CheckboxIndicator
								class="flex h-full w-full items-center justify-center rounded bg-white"
							>
								<Icon icon="radix-icons:check" class="h-3.5 w-3.5" />
							</CheckboxIndicator>
						</CheckboxRoot>
						<span class="select-none">Male</span>
					</label>
					<label
						class="flex flex-row items-center gap-4 [&>.checkbox]:hover:bg-neutral-100"
						for="sex-female"
					>
						<CheckboxRoot
							id="sex-female"
							v-model:checked="female"
							class="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] shadow-gray-500 outline-none focus-within:shadow-[0_0_0_2px_gray] hover:bg-white"
						>
							<CheckboxIndicator
								class="flex h-full w-full items-center justify-center rounded bg-white"
							>
								<Icon icon="radix-icons:check" class="h-3.5 w-3.5" />
							</CheckboxIndicator>
						</CheckboxRoot>
						<span class="select-none">Female</span>
					</label>
				</div>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="word">Word</label>
				<InputExtended
					id="word"
					v-model="word"
					:string-snippets="specialCharacters"
					placeholder="Search for word..."
					aria-label="Word"
				/>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="feature">
					{{ featureLabel.charAt(0).toUpperCase() + featureLabel.slice(1) }}
				</label>
				<input
					id="feature"
					v-model="feature"
					:placeholder="`Search for ${featureLabel}s...`"
					:aria-label="featureLabel"
				/>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="translation">Translation</label>
				<input
					id="translation"
					v-model="translation"
					class="flex"
					placeholder="Search for translation..."
					aria-label="Translation"
				/>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="comment">Comment</label>
				<input
					id="comment"
					v-model="comment"
					placeholder="Search for comment..."
					aria-label="Comment"
				/>
			</div>

			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="word.value === '' && place.value === ''"
				@click.prevent.stop="openSearchResultsWindow"
			>
				Query
			</button>

			<br />
		</form>
	</div>
</template>

<style>
input {
	@apply my-2 border px-3 py-2 w-full shadow;
}

label {
	@apply border px-3 py-2 my-2 w-28 align-baseline;
}
</style>
