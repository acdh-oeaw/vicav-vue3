<script lang="ts" setup>
import dataTypes from "@/config/dataTypes";
import type { ExploreSamplesFormWindowItem, GeoMapWindowItem, WindowItem } from "@/types/global.d";

const { findWindowByTypeAndParam } = useWindowsStore();

interface Props {
	params: ExploreSamplesFormWindowItem["params"];
}

const { data: config } = useProjectInfo();
const specialCharacters = config.value?.projectConfig?.specialCharacters;
const commentOptions = (config.value?.projectConfig?.commentOptions ?? []).map((option) => {
	return { label: option.text, value: option.value } as Tag;
});
const sentenceOptions = Array.from(
	{ length: parseInt(config.value?.projectConfig?.sampleTextSentences ?? "1") },
	(_, index) => {
		return { label: (index + 1).toString(), value: (index + 1).toString() } as Tag;
	},
);

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
const comment = ref([]);
const translation = ref("");
const persons: Ref<Array<string>> = ref([]);

const dataset = simpleItems.value.filter((item) => params.value.dataTypes.includes(item.dataType));
const countries = Array.from(new Set(dataset.map((item) => item.place.country)));
let options: Array<Tag> = [];

countries.forEach((country) => {
	options.push({ label: `${country} (country)`, value: `country:${country}` });
	const countryItems = dataset.filter((item) => item.place.country === country);
	const regions = Array.from(new Set(countryItems.map((item) => item.place.region)));
	regions.forEach((region) => {
		options.push({
			label: `${region} (region)`,
			value: `region:${region}`,
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
	.map((item) => item.person.map((i) => i.name))
	.flat()
	.filter(uniqueFilter)
	.map((item: string) => {
		return { label: item, value: item };
	});

const wordSearch = ref("");

const featureLabelsQuery = useFeatureLabels();

watch(wordSearch, async (value) => {
	if (!value || value.length < 2) return;
	await dataWordsQuery.refetch();
});

const dataWordsQuery = useDataWords(
	{ dataType: props.params.dataTypes[0]!, query: wordSearch },
	{ enabled: false },
);

const wordOptions = computed(() => {
	return ((dataWordsQuery.data.value as unknown as Array<string>) ?? []).map((item) => {
		return { label: item, value: item };
	});
});

const sex = ref(["m", "f"]);

const personsFilter = computed(() =>
	simpleItems.value
		.filter((item) => {
			if (!params.value.dataTypes.includes(item.dataType)) return false;
			if (sex.value.length > 0) {
				if (
					// If none of the participants are of the given sex
					!item.person.map((p) => sex.value.includes(p.sex)).includes(true)
				)
					return false;
			}
			if (
				!item.person
					.map((p) => age.value[0]! < parseInt(p.age) && age.value[1]! > parseInt(p.age))
					.includes(true)
			)
				return false;

			const matchPerson = item.person.map((p) => persons.value.includes(p.name)).includes(true);

			const matchPlace = places.value
				.map((place) => {
					const p = place.split(":");
					if (p[0] === "region" && item.place.region === p[1]) return true;
					if (p[0] === "country" && item.place.country === p[1]) return true;
					if (p[0] === item.place.settlement) return true;
					return false;
				})
				.includes(true);

			if (places.value.length > 0 || persons.value.length > 0) return matchPerson || matchPlace;
			return true;
		})
		.map((item) => item.id),
);

const filterFunction = function (list: Array<string>, searchTerm: string) {
	return list.filter((item) => {
		return item.toLowerCase().includes(searchTerm.toLowerCase());
	});
};
const resultParams = computed(() => {
	return {
		word: words.value.join(","),
		comment: comment.value.join(","),
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

const submitDisabled = computed(() => {
	return (
		(words.value.length === 0 &&
			translation.value === "" &&
			comment.value.length === 0 &&
			places.value.length === 0 &&
			persons.value.length === 0 &&
			features.value.length === 0 &&
			sentences.value.length === 0 &&
			age.value[0] === 0 &&
			age.value[1] === 100 &&
			sex.value[0] === "m" &&
			sex.value[1] === "f") ||
		sex.value.length === 0 ||
		personsFilter.value.length === 0
	);
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

/**
 * Open search results in new window.
 */
const openSearchResultsNewWindow = function () {
	addWindow({
		targetType: "ExploreSamples",
		params: resultWindowParams.value,
		title: `Search results for ${[words.value.join(","), places.value.join(",")].join(", ")}`,
	} as WindowState)!;
	addWindow({
		targetType: "WMap",
		params: {
			title: "Search results",
			queryString: "",
			endpoint: "compare_markers",
			queryParams: queryParams.value,
		},
		title: `${params.value.dataTypes[0]}s for ${[words.value.join(","), places.value.join(",")].join(", ")}`,
	} as WindowState)!;
};
</script>

<template>
	<div class="relative isolate grid size-full overflow-auto">
		<form
			class="block w-full rounded border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		>
			<div class="flex flex-row gap-2.5">
				<label for="place">Place</label>
				<TagsSelect
					v-model="places"
					:filter-function="filterFunction"
					:options="placeOptions"
					placeholder="Search for counries, regions or settlements..."
				></TagsSelect>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="place">Speaker identifier</label>
				<TagsSelect
					v-model="persons"
					:filter-function="filterFunction"
					:options="personOptions"
					placeholder="Search for speaker identifiers eg. Beja1..."
				></TagsSelect>
			</div>

			<div class="flex flex-row gap-2.5">
				<label class="" for="age">Age</label>
				<AgeFilter v-model="age" />
			</div>
			<div class="flex flex-row gap-2.5">
				<label for="sex">Sex</label>
				<SexFilter v-model="sex" />
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="word">Word</label>

				<TagsSelect
					v-model="words"
					v-model:search-term="wordSearch"
					:filter-function="(i) => i"
					:options="wordOptions"
					:placeholder="`Search for words...`"
					:special-characters="specialCharacters"
				/>
			</div>

			<div v-if="params.dataTypes.includes('Feature')" class="flex flex-row gap-2.5">
				<label for="features">Features</label>
				<TagsSelect
					v-if="featureLabelsQuery.data"
					v-model="features"
					:filter-function="filterFunction"
					:options="featureLabelsQuery.data as unknown as Array<Tag>"
					:placeholder="`Search for features...`"
				/>
			</div>

			<div v-if="params.dataTypes.includes('SampleText')" class="flex flex-row gap-2.5">
				<label for="sentence">Sentences</label>
				<TagsSelect
					v-model="sentences"
					class="my-2 flex w-full flex-wrap items-center gap-2 bg-white px-3 py-2 shadow-sm"
					:filter-function="(i) => i"
					:immediate-open="true"
					:options="sentenceOptions"
					:placeholder="`Search for features...`"
				/>
			</div>

			<div v-if="params.dataTypes.includes('Feature')" class="flex flex-row gap-2.5">
				<label for="translation">Translation</label>
				<input
					id="translation"
					v-model="translation"
					aria-label="Translation"
					class="my-2 flex w-full border-gray-300 px-3 py-2 shadow-sm"
					placeholder="Search for translation..."
				/>
			</div>

			<div class="flex flex-row gap-2.5">
				<label for="comment">Comment</label>
				<TagsSelect
					id="comment"
					v-model="comment"
					class="my-2 w-full border-gray-300 px-3 py-2 shadow-sm"
					:filter-function="(i) => i"
					:immediate-open="true"
					:options="commentOptions"
					placeholder="Search for comment..."
				>
				</TagsSelect>
			</div>

			<div v-if="personsFilter.length === 0" class="my-4 rounded-sm border-red-600 bg-red-100 p-4">
				No matching entries in database
			</div>

			<button
				class="inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="submitDisabled"
				@click.prevent.stop="openSearchResultsWindow"
			>
				Query
			</button>

			<button
				class="mt-2 inline-block h-10 w-full whitespace-nowrap rounded border-2 border-solid border-primary bg-on-primary text-center align-middle font-bold text-primary hover:bg-primary hover:text-on-primary disabled:border-gray-400 disabled:text-gray-400 hover:disabled:bg-on-primary hover:disabled:text-gray-400"
				:disabled="submitDisabled"
				@click.prevent.stop="openSearchResultsNewWindow"
			>
				Search in new window
			</button>
		</form>
	</div>
</template>

<style scoped>
@reference "@/styles/index.css";

label {
	@apply px-3 py-2 my-2 w-28 align-baseline;
}
</style>
