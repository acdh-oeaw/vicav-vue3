<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import {
	CheckboxIndicator,
	CheckboxRoot,
	SliderRange,
	SliderRoot,
	SliderThumb,
	SliderTrack,
	TagsInputInput,
	TagsInputItem,
	TagsInputItemDelete,
	TagsInputItemText,
	TagsInputRoot,
} from "radix-vue";

import type { ExploreSamplesFormWindowItem } from "@/types/global.d";

interface Props {
	params: ExploreSamplesFormWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

// const specialCharacters: Array<string> = [
// 	"ē",
// 	"ṛ",
// 	"ṯ",
// 	"ẓ",
// 	"ū",
// 	"ī",
// 	"ō",
// 	"ā",
// 	"š",
// 	"ḏ",
// 	"ṭ",
// 	"ǧ",
// 	"ḥ",
// 	"ž",
// 	"ṣ",
// 	"ḏ̣",
// 	"ʕ",
// 	"ʔ",
// 	"ġ",
// 	"ḅ",
// 	"ṃ",
// ];

const { simpleItems } = useTEIHeaders();
const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

interface Tag {
	label: string;
	value: string;
}

const places = ref([]);
const words = ref([]);
const features = ref([]);
const sentences = ref([]);
const age: Ref<Array<number>> = ref([0, 100]);
const male = ref(true);
const female = ref(true);
const comment = ref("");
const translation = ref("");
const persons = ref([]);

const dataset = simpleItems.value.filter((item) => params.value.dataTypes.includes(item.dataType));
const countries = Array.from(new Set(dataset.map((item) => item.place.country)));
let options: Array<Tag> = [];

countries.forEach((country) => {
	options.push({ label: country + " (country)", value: "country:" + country });
	const countryItems = dataset.filter((item) => item.place.country === country);
	const regions = Array.from(new Set(countryItems.map((item) => item.place.region)));
	regions.forEach((region) => {
		options.push({
			label: region + " (region)",
			value: "region:" + region,
		});

		const settlements = Array.from(
			new Set(
				countryItems.filter((item) => item.place.region === region).map((item) => item.place.name),
			),
		).sort();

		options = options.concat(
			settlements.map((item: string) => {
				return { label: item, value: item };
			}),
		);
	});
});

const placeOptions = options;

const uniqueFilter = function (value, index, array) {
	return array.indexOf(value) === index;
};
const personOptions = dataset
	.map((item) => item.person.name)
	.filter(uniqueFilter)
	.map((item: string) => {
		return { label: item, value: item };
	});

const featureLabelsQuery = useFeatureLabels();
const dataWordsQuery = useDataWords({ dataType: props.params.dataTypes[0] });
const wordOptions = computed(() => {
	return (dataWordsQuery.data.value ?? []).map((item) => {
		return { label: item, value: item };
	});
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
			if (persons.value.length > 0 && persons.value.includes(item.person.name)) return true;

			if (places.value.length > 0) {
				const found = places.value.map((place) => {
					const p = place.split(":");
					if (p[0] === "region" && item.place.region === p[1]) return true;
					if (p[0] === "country" && item.place.country === p[1]) return true;
					if (p[0] === item.place.name) return true;
				});
				if (!found.includes(true)) return false;
			}

			if (sex.value.length > 0 && !sex.value.includes(item.person.sex)) return false;
			if (age.value[0] > parseInt(item.person.age) || age.value[1] < parseInt(item.person.age))
				return false;

			return true;
		})
		.map((item) => item.person.name);

	addWindow({
		targetType: "ExploreSamples",
		params: {
			dataType: params.value.dataTypes[0],
			word: words.value.join(","),
			comment: comment.value,
			features:
				params.value.dataTypes[0] === "Feature"
					? features.value.join(",")
					: sentences.value.join(","),
			translation: translation.value,
			person: personsFilter.join(","),
		},
		title: `Search results for ${[words.value.join(","), places.value.join(",")].join(", ")}`,
	} as WindowState);
};
</script>

<template>
	<div class="relative isolate grid h-full w-full overflow-auto">
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<div class="flex flex-row gap-2.5">
				<label for="place">Place</label>
				<TagsSelect
					v-model="places"
					:options="placeOptions"
					placeholder="Search for counries, regions or settlements..."
				></TagsSelect>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="place">Speaker identifier</label>
				<TagsSelect
					v-model="persons"
					:options="personOptions"
					placeholder="Search for speaker identifiers eg. Beja1..."
				></TagsSelect>
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

				<TagsSelect
					v-if="wordOptions"
					v-model="words"
					:placeholder="`Search for words...`"
					:options="wordOptions"
				/>
			</div>

			<div v-if="params.dataTypes.includes('Feature')" class="flex flex-row gap-2.5">
				<label for="features">Features</label>
				<TagsSelect
					v-if="featureLabelsQuery.data"
					v-model="features"
					:placeholder="`Search for features...`"
					:options="featureLabelsQuery.data"
				/>
			</div>

			<div v-if="params.dataTypes.includes('SampleText')" class="flex flex-row gap-2.5">
				<label for="sentence">Sentences</label>
				<TagsInputRoot
					v-model="sentences"
					delimiter=""
					class="my-2 flex w-full flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 shadow"
				>
					<TagsInputItem
						v-for="item in sentences"
						:key="item"
						:value="item"
						class="flex items-center justify-center gap-2 rounded bg-primary px-2 py-1 text-white aria-[current=true]:bg-primary"
					>
						<TagsInputItemText class="text-sm">{{ item }}</TagsInputItemText>
						<TagsInputItemDelete>
							<Icon icon="lucide:x" />
						</TagsInputItemDelete>
					</TagsInputItem>

					<TagsInputInput
						placeholder="Filter sentences..."
						class="flex flex-wrap items-center gap-2 rounded !bg-transparent px-1 focus:outline-none"
					/>
				</TagsInputRoot>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="translation">Translation</label>
				<input
					id="translation"
					v-model="translation"
					class="my-2 flex w-full border-gray-300 px-3 py-2 shadow"
					placeholder="Search for translation..."
					aria-label="Translation"
				/>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="comment">Comment</label>
				<input
					id="comment"
					v-model="comment"
					class="my-2 w-full border-gray-300 px-3 py-2 shadow"
					placeholder="Search for comment..."
					aria-label="Comment"
				/>
			</div>

			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="words.value === [] && places.value === []"
				@click.prevent.stop="openSearchResultsWindow"
			>
				Query
			</button>

			<br />
		</form>
	</div>
</template>

<style>
label {
	@apply px-3 py-2 my-2 w-28 align-baseline;
}
</style>
