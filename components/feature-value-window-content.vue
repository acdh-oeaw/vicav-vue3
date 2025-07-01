<script lang="ts" setup>
import { ExternalLink } from "lucide-vue-next";

import type { FeatureValueWindowItem } from "@/types/global.d";
import type { simpleTEIMetadata } from "@/types/teiCorpus";

interface Props {
	params: FeatureValueWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const tableContent: Array<{ key: string; displayHeader?: string }> = [
	{ key: "title", displayHeader: "Feature Value" },
	{ key: "taxonomy" },
	{ key: "desc" },
	{ key: "feature" },
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
	{ key: "examples" },
	{ key: "note" },
	{ key: "remarks" },
	{ key: "constraints" },
	{ key: "exceptions" },
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
</script>

<template>
	<div class="relative isolate grid size-full overflow-auto">
		<div v-if="params.showCitation">
			<Citation :header="citation" type="entry" />
		</div>
		<Table>
			<TableBody>
				<TableRow v-for="entry in tableData" :key="entry.key">
					<TableCell class="capitalize">{{ entry.displayHeader ?? entry.key }}</TableCell>
					<TableCell v-for="value in entry.values" :key="`${entry.key}-${value}`">
						<template v-if="entry.key == 'source' && isLinkType(value)">
							<NuxtLink class="flex gap-1" external target="_blank" :to="value.link">
								<span>{{ value.link ? "" : "Fieldwork campaign" }} {{ value.short_cit }}</span>
								<span class="sr-only">View Source</span
								><ExternalLink class="inline-block size-3.5" /> </NuxtLink
						></template>
						<template v-else> {{ value }}</template>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</div>
</template>
