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

import dataTypes from "@/config/dataTypes";
import type { ExploreSamplesFormWindowItem, GeoMapWindowItem, WindowItem } from "@/types/global.d";

const { findWindowByTypeAndParam } = useWindowsStore();

interface Props {
	params: ExploreSamplesFormWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);
const { simpleItems } = useTEIHeaders();
const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

interface Tag {
	label: string;
	value: string;
	heading?: boolean;
}

const mapWindow: Ref<WindowItem | null> = ref(null);
const resultsWindow: Ref<WindowItem | null> = ref(null);

const places: Ref<Array<string>> = ref([]);
const words: Ref<Array<string>> = ref([]);
const features: Ref<Array<string>> = ref([]);
const sentences: Ref<Array<string>> = ref([]);

const age: Ref<Array<number>> = ref([0, 100]);
const male = ref(true);
const female = ref(true);
const comment = ref("");
const translation = ref("");
const persons: Ref<Array<string>> = ref([]);

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
			heading: true,
		});

		const settlements = Array.from(
			new Set(
				countryItems
					.filter((item) => item.place.region === region)
					.map((item) => item.place.settlement),
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

const uniqueFilter = function (value: unknown, index: number, array: Array<unknown>) {
	return array.indexOf(value) === index;
};
const personOptions = dataset
	.map((item) => item.person.name)
	.filter(uniqueFilter)
	.map((item: string) => {
		return { label: item, value: item };
	});

const featureLabelsQuery = useFeatureLabels();
const dataWordsQuery = useDataWords({ dataType: props.params.dataTypes[0]! });
const wordOptions = computed(() => {
	return (dataWordsQuery.data.value ?? []).map((item) => {
		return { label: item, value: item };
	});
});

const sex = computed(() => {
	const result = [];
	if (male.value) result.push("m");
	if (female.value) result.push("f");
	return result;
});

const personsFilter = computed(() =>
	simpleItems.value
		.filter((item) => {
			if (!params.value.dataTypes.includes(item.dataType)) return false;
			if (persons.value.length > 0) return persons.value.includes(item.person.name);
			else if (places.value.length > 0) {
				const found = places.value.map((place) => {
					const p = place.split(":");
					if (p[0] === "region" && item.place.region === p[1]) return true;
					if (p[0] === "country" && item.place.country === p[1]) return true;
					if (p[0] === item.place.settlement) return true;
					return false;
				});
				if (!found.includes(true)) return false;
			}
			if (sex.value.length > 0 && !sex.value.includes(item.person.sex)) return false;
			return !(
				age.value[0]! > parseInt(item.person.age) || age.value[1]! < parseInt(item.person.age)
			);
		})
		.map((item) => item.id),
);

const resultParams = computed(() => {
	console.log(params.value.dataTypes);
	return {
		word: words.value.join(","),
		comment: comment.value,
		features:
			params.value.dataTypes[0] === "Feature"
				? features.value.join(",")
				: sentences.value.join(","),
		translation: translation.value,
		ids: personsFilter.value.join(","),
	};
});

const resultWindowParams = computed(() => {
	return Object.assign(resultParams.value, {
		dataType: params.value.dataTypes[0],
		page: 1,
	});
});

const queryParams = computed(() => {
	return Object.assign(resultParams.value, {
		type: dataTypes[params.value.dataTypes[0]!].collection.replace("vicav_", "") as
			| "samples"
			| "lingfeatures",
	});
});

/**
 * Intercept anchor clicks to open window instead of navigating.
 */
const openSearchResultsWindow = function () {
	resultsWindow.value = findWindowByTypeAndParam(
		"ExploreSamples",
		"dataType",
		params.value.dataTypes[0]!,
	);
	mapWindow.value = findWindowByTypeAndParam("WMap", "queryParams.type", queryParams.value.type);

	if (!resultsWindow.value)
		resultsWindow.value = addWindow({
			targetType: "ExploreSamples",
			params: resultWindowParams.value,
			title: `Search results for ${[words.value.join(","), places.value.join(",")].join(", ")}`,
		} as WindowState)!;
	else {
		resultsWindow.value.params = resultWindowParams.value;
		resultsWindow.value.winbox.setTitle(
			`Search results for ${[words.value.join(","), places.value.join(",")].join(", ")}`,
		);
		resultsWindow.value.winbox.focus();
		resultsWindow.value.winbox.addClass("highlighted");
		setTimeout(() => {
			resultsWindow.value!.winbox.removeClass("highlighted");
		}, 1000);
	}

	if (!mapWindow.value)
		mapWindow.value = addWindow({
			targetType: "WMap",
			params: {
				title: "Search results",
				queryString: "",
				endpoint: "compare_markers",
				queryParams: queryParams.value,
			},
			title: `${params.value.dataTypes[0]}s for ${[words.value.join(","), places.value.join(",")].join(", ")}`,
		} as WindowState)!;
	else {
		(mapWindow.value as GeoMapWindowItem).params.queryParams = queryParams.value;
		mapWindow.value.winbox.setTitle(
			`Search results for ${[words.value.join(","), places.value.join(",")].join(", ")}`,
		);
		mapWindow.value.winbox.focus();
		mapWindow.value.winbox.addClass("highlighted");
		setTimeout(() => {
			mapWindow.value!.winbox.removeClass("highlighted");
		}, 1000);
	}
};
</script>

<template>
	<div class="size-full relative isolate grid overflow-auto">
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
						:max="100"
						:min="0"
						:step="10"
					>
						<SliderTrack class="relative h-[3px] grow rounded-full bg-gray-400">
							<SliderRange class="absolute h-full rounded-full bg-primary" />
						</SliderTrack>
						<SliderThumb
							aria-label="Min age"
							class="size-5 block rounded-[10px] bg-white shadow-[0_2px_10px] focus:shadow-[0_0_0_2px]"
						/>
						<SliderThumb
							aria-label="Max age"
							class="size-5 block rounded-[10px] bg-white shadow-[0_2px_10px] shadow-primary focus:shadow-[0_0_0_2px] focus:shadow-gray-400"
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
							class="size-[25px] flex appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] shadow-gray-500 outline-none focus-within:shadow-[0_0_0_2px_gray]"
							if="sex-male"
						>
							<CheckboxIndicator
								class="size-full flex items-center justify-center rounded bg-white"
							>
								<Icon class="size-3.5" icon="radix-icons:check" />
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
							class="size-[25px] flex appearance-none items-center justify-center rounded-[4px] bg-white shadow-[0_2px_10px] shadow-gray-500 outline-none focus-within:shadow-[0_0_0_2px_gray] hover:bg-white"
						>
							<CheckboxIndicator
								class="size-full flex items-center justify-center rounded bg-white"
							>
								<Icon class="size-3.5" icon="radix-icons:check" />
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
					:options="wordOptions"
					:placeholder="`Search for words...`"
				/>
			</div>

			<div v-if="params.dataTypes.includes('Feature')" class="flex flex-row gap-2.5">
				<label for="features">Features</label>
				<TagsSelect
					v-if="featureLabelsQuery.data"
					v-model="features"
					:options="featureLabelsQuery.data as unknown as Array<Tag>"
					:placeholder="`Search for features...`"
				/>
			</div>

			<div v-if="params.dataTypes.includes('SampleText')" class="flex flex-row gap-2.5">
				<label for="sentence">Sentences</label>
				<TagsInputRoot
					v-model="sentences"
					class="my-2 flex w-full flex-wrap items-center gap-2 bg-white px-3 py-2 shadow"
					delimiter=""
				>
					<TagsInputItem
						v-for="item in sentences"
						:key="item"
						class="flex items-center justify-center gap-2 rounded bg-primary px-2 py-1 text-white aria-[current=true]:bg-primary"
						:value="item"
					>
						<TagsInputItemText class="text-sm">{{ item }}</TagsInputItemText>
						<TagsInputItemDelete>
							<Icon icon="lucide:x" />
						</TagsInputItemDelete>
					</TagsInputItem>

					<TagsInputInput
						class="flex flex-1 gap-2 !bg-transparent px-1 focus:outline-none"
						placeholder="Enter sentence numbers. Press enter key to select..."
					/>
				</TagsInputRoot>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="translation">Translation</label>
				<input
					id="translation"
					v-model="translation"
					aria-label="Translation"
					class="my-2 flex w-full border-gray-300 px-3 py-2 shadow"
					placeholder="Search for translation..."
				/>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="comment">Comment</label>
				<input
					id="comment"
					v-model="comment"
					aria-label="Comment"
					class="my-2 w-full border-gray-300 px-3 py-2 shadow"
					placeholder="Search for comment..."
				/>
			</div>

			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="
					words.length === 0 &&
					translation == '' &&
					comment == '' &&
					places.length === 0 &&
					persons.length === 0 &&
					features.length === 0 &&
					sentences.length === 0
				"
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
