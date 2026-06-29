<script lang="ts" setup>
import type { Table } from "@tanstack/vue-table";
import { ExternalLink, Map } from "lucide-vue-next";

import { type FeatureValueWindowItem, GeojsonMapSchema, type WindowItem } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus";

interface Props {
	params: FeatureValueWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

type QueryUpdateType = "value" | "any";
const tableContent: Array<{
	key: string;
	displayHeader?: string;
	updateQueryTo?: QueryUpdateType;
}> = [
	{ key: "title", displayHeader: "Feature Value", updateQueryTo: "value" },
	{ key: "taxonomy" },
	{ key: "desc" },
	{ key: "feature", updateQueryTo: "any" },
	{ key: "examples" },
	{ key: "note" },
	{ key: "remarks" },
	{ key: "constraints" },
	{ key: "exceptions" },
	{ key: "place" },
	{ key: "variety" },
	{ key: "source" },
	{ key: "religion" },
	{ key: "ageGroup" },
	{ key: "gender" },
	{ key: "socio" },
	{ key: "tribe" },
	{
		key: "first_language",
		displayHeader: "First Language",
	},
	{
		key: "source_representations",
		displayHeader: "Original transcription",
	},
	{ key: "resp", displayHeader: "Entered by" },
];

const tableData = computed(() => {
	const values = params.value.values;
	const t = tableContent
		.filter((entry) => values.find((value) => entry.key in value && value[entry.key] !== undefined))
		.flatMap((entry) => {
			return {
				...entry,
				values: values.map((value) =>
					Array.isArray(value[entry.key])
						? entry.key === "examples"
							? (value[entry.key] as Array<object>)
									.map((example) => `${Object.keys(example)[0]} (${Object.values(example)[0]})`)
									.join("; ")
							: (value[entry.key] as Array<string>).join("; ")
						: value[entry.key],
				),
			};
		});
	return t;
});

interface LinkType {
	link?: string;
	short_cit?: string;
}
function isLinkType(val: unknown): val is LinkType {
	return "link" in (val as object) || "short_cit" in (val as object);
}
const citation = computed(() => {
	const author = tableData.value.find((entry) => entry.key === "resp")?.values ?? [];
	const place = tableData.value.find((entry) => entry.key === "place")?.values[0];
	const feature = tableData.value.find((entry) => entry.key === "feature")?.values[0];
	const value = tableData.value.find((entry) => entry.key === "title")?.values[0];
	return {
		author,
		title: `${feature}: ${value} | ${place}`,
	} as simpleTEIMetadata;
});

const { tables } = useGeojsonStore();
const openOrUpdateWindow = useOpenOrUpdateWindow();
const { parseSearchString } = useFilterParser();
const { wibarabGeojsonUrl } = useGeojsonStore();
function getQueryString(updateQueryTo: QueryUpdateType, entry: (typeof props.params.values)[0]) {
	return updateQueryTo === "value"
		? `${entry.featureId}:"${entry.title}"`
		: `${entry.featureId}:ANY`;
}
function updateMap(updateQueryTo: QueryUpdateType, entry: (typeof props.params.values)[0]) {
	const table = tables.get(wibarabGeojsonUrl);
	if (!table) return;
	const searchString = getQueryString(updateQueryTo, entry);

	parseSearchString(searchString, table as Table<unknown>);
	table.setGlobalFilter(searchString);
	openOrUpdateWindow(
		{
			targetType: "GeojsonMap",
			params: {
				url: wibarabGeojsonUrl,
				markerType: "petal",
			},
		} as unknown as WindowItem,
		"Variety Data - Map View",
		GeojsonMapSchema.shape.params,
		"url",
		true,
	);
}
function onFeatureClick(val: Record<string, unknown>) {
	openOrUpdateWindow(
		{
			targetType: "FeatureStatistics",
			params: {
				featureId: val.featureId,
				showCitation: false,
			},
		} as unknown as WindowItem,
		`Feature: ${val.feature}`,
	);
}
</script>

<template>
	<TooltipProvider>
		<div class="relative isolate grid size-full overflow-auto">
			<div v-if="params.showCitation">
				<Citation :header="citation" type="entry" />
			</div>
			<Table>
				<TableBody>
					<TableRow v-for="entry in tableData" :key="entry.key">
						<TableCell class="capitalize">{{ entry.displayHeader ?? entry.key }}</TableCell>
						<TableCell v-for="(value, valueIdx) in entry.values" :key="`${entry.key}-${value}`">
							<template v-if="entry.key == 'source' && isLinkType(value)">
								<NuxtLink class="flex gap-1" external target="_blank" :to="value.link">
									<span>{{ value.link ? "" : "Fieldwork campaign" }} {{ value.short_cit }}</span>
									<span class="sr-only">View Source</span
									><ExternalLink class="inline-block size-3.5" /> </NuxtLink
							></template>
							<template v-else-if="entry.key === 'feature'">
								<Button
									class="h-auto shrink-0 p-0 font-normal text-black!"
									variant="link"
									@click="onFeatureClick(params.values[valueIdx])"
									>{{ value }}</Button
								></template
							>
							<template v-else> {{ value }}</template>

							<Tooltip v-if="entry.updateQueryTo">
								<TooltipTrigger>
									<Button
										class="ml-1 h-fit px-2"
										variant="ghost"
										@click="updateMap(entry.updateQueryTo, params.values[valueIdx])"
									>
										<span>Show on map</span>
										<Map class="ml-1 size-4"></Map>
									</Button>
								</TooltipTrigger>
								<TooltipContent class="bg-white"
									>Overwrite the current query with
									<span class="italic">{{
										getQueryString(entry.updateQueryTo, params.values[valueIdx])
									}}</span>
								</TooltipContent>
							</Tooltip>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	</TooltipProvider>
</template>
