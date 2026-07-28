<script setup lang="ts">
import { ref } from "vue";

const wrapper = ref();
const steps = [
	{
		attachTo: { element: "#results-table" },
		content: {
			title: "The Variety Table",
			description:
				"Every row is a documented language variety (a city, region, or community). Columns appear here once you filter by a linguistic feature, showing the actual attested form for each variety.",
		},
	},
	{
		attachTo: { element: "#results-table tbody tr:first-child" },
		content: {
			title: "Inspect a Variety",
			description:
				"Click any row to open a detail panel below the table listing every recorded feature, source, and metadata entry for that variety.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="jump-to-location"]' },
		content: {
			title: "Jump to a Location",
			description:
				"Use this search box to quickly scroll the table (and center the map) on a specific city or variety by name, without scrolling through all 344 entries.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="show-details"]' },
		content: {
			title: "Show Details Toggle",
			description:
				"Turn this on to expand extra metadata columns inline in the table instead of opening the detail panel for each row individually.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="export-data"]' },
		content: {
			title: "Export Data",
			description:
				"Download the currently filtered table results as a file, useful once you've narrowed the data down with the filters we'll cover next.",
		},
	},
	{
		attachTo: { element: "#pagesizeSelect" },
		content: {
			title: "Page Size",
			description:
				"Control how many varieties are listed per page: 10, 20, 30, 40, or 50 rows at a time.",
		},
	},
	{
		attachTo: { element: "#pageSelect" },
		content: {
			title: "Pagination",
			description:
				"Jump directly to any page of results, or use the first/previous/next/last arrows beside it to move sequentially through all matching varieties.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="map-container"]' },
		content: {
			title: "The Map View",
			description:
				"Each dot represents a variety with recorded data. Pan and zoom like any web map; the marker count and legend at the bottom left update live as you filter.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="feature-category-personal-pronouns"]' },
		content: {
			title: "Linguistic Feature Categories",
			description:
				"These menus (Personal Pronouns, Consonant Phenomena, Vowel Phenomena, Phonotactics, Verbal Morphology, Syntax, Lexicon) group the hundreds of tracked linguistic features. Open one to drill down into sub-features.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="feature-value-picker"]' },
		content: {
			title: "Selecting Feature Values",
			description:
				'Picking a specific feature (e.g. "Independent personal pronoun 3SG.M") opens a checklist of attested values, each with a count of how many varieties use it. Check the ones you want visible and click "Save changes" to apply the filter to both the map and table.',
		},
	},
	{
		attachTo: { element: '[data-onboarding="filter-traditional-classification"]' },
		content: {
			title: "Classification & Country Filters",
			description:
				"Beyond linguistic features, you can filter by Traditional Classification (e.g. sedentary vs. Bedouin dialects) or by Country the same way: pick values from the checklist and save.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="filter-metadata"]' },
		content: {
			title: "Metadata Filters",
			description:
				"This menu filters by data-collection metadata rather than language features, things like Source, Religion, Tribe, Age Group, Gender, and First Language of the speakers recorded.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="query-input"]' },
		content: {
			title: "The Query Box",
			description:
				'Every filter you apply above is added here as a query chip, and the same box also shows a plain-text query string (e.g. ft_pr_sg_p3_m:"hū / huw / hūw"). You can combine multiple filters this way to narrow results precisely.',
		},
	},
	{
		attachTo: { element: '[data-onboarding="query-mode-toggle"]' },
		content: {
			title: "Text Mode",
			description:
				"Prefer typing your own query? Click this icon to switch between the guided dropdown mode and a raw text mode where you can write the query syntax directly.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="search-button"]' },
		content: {
			title: "Running a Search",
			description:
				"Once your filters or typed query are set, click Search to apply them, this updates the table rows and the map markers together, so both views always stay in sync.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="map-legend"]' },
		content: {
			title: "Map Legend",
			description:
				"This panel shows the total marker count and, when a feature is selected, a color/icon breakdown of which value each marker represents. Click it to expand or collapse.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="marker-settings"]' },
		content: {
			title: "Marker Settings",
			description:
				"Customize how markers are displayed: toggle labels, switch to greyscale, adjust marker size and stroke width, or show all feature values for a location instead of just the selected one.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="map-download"]' },
		content: {
			title: "Download Map Data",
			description:
				"Export the currently visible map markers and their data, handy for offline analysis or sharing a filtered subset of the dataset.",
		},
	},
	{
		attachTo: { element: '[data-onboarding="app-logo"]' },
		content: {
			title: "You're All Set",
			description:
				"That covers the table, the map, and how filtering and querying keep both in sync. Explore the feature menus above to start building your own queries.",
		},
	},
];
onMounted(() => {
	wrapper.value?.start();
});
</script>

<template>
	<Teleport :to="'body'">
		<VOnboardingWrapper
			ref="wrapper"
			class="z-30"
			:options="{ scrollToStep: { enabled: false } }"
			:steps="steps"
	/></Teleport>
</template>
