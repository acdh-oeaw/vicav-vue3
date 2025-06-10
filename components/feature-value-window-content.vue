<script lang="ts" setup>
import { ExternalLink } from "lucide-vue-next";

import type { FeatureValueWindowItem } from "@/types/global.d";

interface Props {
	params: FeatureValueWindowItem["params"];
}

const props = defineProps<Props>();
const { params }: { params: Ref<Record<string, string | Array<string> | object>> } = toRefs(props);

const tableContent: Array<{ key: string; displayHeader?: string; introductoryText?: string }> = [
	{ key: "title", displayHeader: "Feature Value" },
	{ key: "desc" },
	{ key: "feature" },
	{ key: "place", introductoryText: "Attested in: {}" },
	{ key: "sources", introductoryText: "Collected from: {}" },
	{ key: "religion", introductoryText: "Used by: {}" },
	{ key: "ageGroup", introductoryText: "Used by: {}" },
	{ key: "gender", introductoryText: "Used by: {}" },
	{ key: "socio", introductoryText: "Used by: {}" },
	{ key: "tribe", introductoryText: "Used by: {} (tribe)" },
	{
		key: "first_language",
		displayHeader: "First Language",
		introductoryText: "Used by: {} (first language)",
	},
	{
		key: "source_representations",
		displayHeader: "Original transcription",
		introductoryText: "Originally transcribed as: {}",
	},
	{ key: "examples", introductoryText: "{}" },
	{ key: "note", introductoryText: "Note: {}" },
	{ key: "remarks", introductoryText: "Remarks: {}" },
	{ key: "constraints", introductoryText: "Constraints: {}" },
	{ key: "exceptions", introductoryText: "Exceptions: {}" },
];

const tableData = computed(() => {
	return tableContent
		.filter((entry) => entry.key in (params.value as object))
		.flatMap((entry) => {
			if (Array.isArray(params.value[entry.key])) {
				return (params.value[entry.key] as Array<string>).map((val: string) => ({
					...entry,
					value: val,
				}));
			}
			return {
				...entry,
				value: params.value[entry.key] as string | Record<string, Record<string, string>>,
			};
		});
});
</script>

<template>
	<div class="relative isolate grid size-full overflow-auto">
		<Table>
			<TableBody>
				<TableRow v-for="entry in tableData" :key="entry.key">
					<TableCell class="capitalize">{{ entry.displayHeader ?? entry.key }}</TableCell>
					<TableCell>
						<template v-if="entry.key == 'sources'">
							<NuxtLink
								v-for="source in entry.value as Record<string, Record<string, string>>"
								:key="source.link"
								class="flex gap-1"
								external
								target="_blank"
								:to="source.link"
							>
								<span>{{ source.link ? "" : "Fieldwork campaign" }} {{ source.short_cit }}</span>
								<span class="sr-only">View Source</span
								><ExternalLink class="inline-block size-3.5" /> </NuxtLink
						></template>
						<template v-else>
							{{
								entry.introductoryText
									? entry.introductoryText.replace("{}", entry.value as string)
									: entry.value
							}}</template
						>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</div>
</template>
