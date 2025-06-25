<script setup lang="ts">
import type { Column } from "@tanstack/vue-table";
import {
	Contact,
	ExternalLink,
	Languages,
	type LucideIcon,
	Mars,
	MessageSquare,
	UsersRound,
	Venus,
	VenusAndMars,
} from "lucide-vue-next";
import type { DefineComponent } from "vue";
import ChurchOutlineIcon from "vue-material-design-icons/ChurchOutline.vue";
import MosqueOutlineIcon from "vue-material-design-icons/MosqueOutline.vue";
import SynagogueOutlineIcon from "vue-material-design-icons/SynagogueOutline.vue";

import type { WindowItem } from "@/types/global";

const props = defineProps<{
	value?: Record<string, unknown>;
	highlightedValues?: Array<string>;
	column: Column<PatchedFeatureType>;
	fullEntry: PatchedFeatureType["properties"];
}>();

function getSources(featureValueEntry: unknown) {
	return (featureValueEntry as Record<string, Record<string, Record<string, string>>>).sources;
}
const iconMap: Record<string, Record<string, LucideIcon | DefineComponent>> = {
	gender: {
		"#male": Mars,
		"pgr:male": Mars,
		Men: Mars,
		"#female": Venus,
		"pgr:female": Venus,
		Women: Venus,
		"#default": VenusAndMars,
	},
	firstLanguage: {
		"#default": Languages,
	},
	ageGroup: {
		"#default": Contact,
	},
	tribe: {
		"#default": UsersRound,
	},
	religion: {
		Jews: SynagogueOutlineIcon,
		Christians: ChurchOutlineIcon,
		"#default": MosqueOutlineIcon,
	},
	source_representations: {
		"#default": Languages,
	},
	variety: {
		"#default": Languages,
	},
	examples: {
		"#default": MessageSquare,
	},
};
const nonPersonGroupKeys = ["sources"];
const hiddenKeys = ["remarks", "exceptions", "constraints", "source_representations"];
function getPersonGroups(featureValueEntry: unknown, selectKey?: string | Array<string>) {
	const personGroups = Object.entries((featureValueEntry as Record<string, Array<string>>) ?? {})
		.filter(([key]) => !nonPersonGroupKeys.includes(key))
		.filter(([key]) =>
			selectKey ? (Array.isArray(selectKey) ? selectKey.includes(key) : key === selectKey) : true,
		)
		.flatMap(([key, val]) => {
			return val.map(
				(entry) => {
					return { [key]: entry };
				},
				{} as Record<string, string>,
			);
		});
	return personGroups.toSorted(
		(a, b) =>
			(Object.keys(a)[0]?.localeCompare(Object.keys(b)[0] ?? "") ||
				Object.values(a)[0]?.localeCompare(Object.values(b)[0] ?? "")) ??
			0,
	);
}
function getPersonGroupIcon(personGroup: Record<string, string>) {
	for (const key in personGroup) {
		if (iconMap[key]) {
			if (iconMap[key][personGroup[key]!])
				return { icon: iconMap[key][personGroup[key]!], hideValue: true };
			else if (iconMap[key]["#default"])
				return { icon: iconMap[key]["#default"], hideValue: false };
		}
	}
	return null;
}
function trimPrefix(str: string) {
	return str.replace(/(#|pgr:)/, "");
}
const { showAllDetails } = storeToRefs(useGeojsonStore());
const infoOpen = ref(
	Object.fromEntries(
		Object.keys(props.value ?? {}).map((key) => [key, showAllDetails.value ?? false]),
	),
);
watch(
	() => showAllDetails.value,
	() => {
		infoOpen.value = Object.fromEntries(
			Object.keys(props.value ?? {}).map((key) => [key, showAllDetails.value ?? false]),
		);
	},
);

const { getPetalSVG } = usePetalMarker();
const { buildFeatureValueId } = useColorsStore();
const { AND_OPERATOR } = useAdvancedQueries();

const flattenedHighlightedValues = computed(() => {
	return props.highlightedValues?.flatMap((val) => val.split(AND_OPERATOR)) ?? [];
});

function getPetalEntry(featureValue: string) {
	if (props.highlightedValues?.includes(featureValue))
		// value is directly selected
		return { id: buildFeatureValueId(props.column.id, featureValue) };
	else {
		// check if value is selected in combined filter ("{x} AND {y}")
		const combined = props.highlightedValues?.find(
			(val) => val.includes(AND_OPERATOR) && val.split(AND_OPERATOR).includes(featureValue),
		);
		if (combined) return { id: buildFeatureValueId(props.column.id, combined) };
	}
	return { id: props.column.id, strokeOnly: true };
}

const sortedValues = computed(() => {
	return Object.entries(props.value ?? {}).toSorted(([a, _a], [b, _b]) => {
		const indexA = flattenedHighlightedValues.value?.includes(String(a)) ? -1 : 1;
		const indexB = flattenedHighlightedValues.value?.includes(String(b)) ? -1 : 1;
		return indexA === indexB ? a.localeCompare(b) : indexA - indexB;
	}) as Array<[string, Record<string, unknown>]>;
});

const openOrUpdateWindow = useOpenOrUpdateWindow();
function onValueClick(val: Record<string, unknown>, title: string) {
	openOrUpdateWindow(
		{
			targetType: "FeatureValue",
			params: {
				...val,
				title,
				place: props.fullEntry.name,
				feature: props.column.columnDef.header,
			},
		} as unknown as WindowItem,
		`${props.fullEntry.name} | ${props.column.columnDef.header} | ${title}`,
	);
}
</script>

<template>
	<div :class="{ 'flex flex-wrap gap-x-2': !showAllDetails, 'gap-2': showAllDetails }">
		<div
			v-for="[key, val] in sortedValues"
			:key="key"
			class="my-0.5"
			:class="{ 'inline-block': !infoOpen[key], block: infoOpen[key] }"
		>
			<div
				class="items-center gap-y-0"
				:class="{
					'inline-flex gap-x-0.5': !infoOpen[key],
					'flex gap-x-2 flex-wrap': infoOpen[key],
				}"
			>
				<svg class="size-3.5 shrink-0" v-html="getPetalSVG(getPetalEntry(key)).outerHTML"></svg>
				<Button
					class="flex-shrink-0 truncate p-0 h-auto !text-black"
					:class="{
						'font-medium': flattenedHighlightedValues?.includes(key),
						'font-light': !flattenedHighlightedValues?.includes(key),
					}"
					variant="link"
					@click="onValueClick(val, key)"
					><Ellipsis cut-words="first" :max-length="!infoOpen[key] ? 15 : 30">{{
						key
					}}</Ellipsis></Button
				>
				<TooltipProvider>
					<template v-for="personGroup in getPersonGroups(val, ['tribe', 'religion'])">
						<Tooltip v-for="(personGroupVal, personGroupKey) in personGroup" :key="personGroupVal">
							<TooltipTrigger
								><Badge
									class="line-clamp-1 ml-0.5"
									:class="{ 'gap-1': !getPersonGroupIcon(personGroup)?.hideValue && infoOpen[key] }"
									variant="outline"
								>
									<component
										:is="getPersonGroupIcon(personGroup)!.icon"
										v-if="getPersonGroupIcon(personGroup)"
										class="shrink-0"
										:size="12"
									/>
									<span :class="{ 'sr-only': getPersonGroupIcon(personGroup) }"
										>{{ personGroupKey }}:
									</span>
									<span
										class="line-clamp-1"
										:class="{
											'sr-only':
												personGroupKey !== 'tribe' &&
												(getPersonGroupIcon(personGroup)?.hideValue || !infoOpen[key]),
										}"
										>{{ trimPrefix(personGroupVal) }}</span
									>
								</Badge></TooltipTrigger
							>
							<TooltipContent class="bg-background capitalize"
								><span>{{ personGroupKey }}: {{ trimPrefix(personGroupVal) }}</span></TooltipContent
							>
						</Tooltip>
					</template></TooltipProvider
				>

				<Collapsible
					v-if="(getPersonGroups(val).length > 0 || getSources(val)) && infoOpen"
					v-model:open="infoOpen[key]"
					class="flex gap-2"
				>
					<CollapsibleContent orientation="horizontal"
						><div class="inline-flex items-center gap-2 text-ellipsis">
							<TooltipProvider>
								<template
									v-for="personGroup in getPersonGroups(val).filter(
										(group) =>
											!group['tribe'] &&
											!group['religion'] &&
											Object.keys(group).every((key) => !hiddenKeys.includes(key)),
									)"
								>
									<Tooltip
										v-for="(personGroupVal, personGroupKey) in personGroup"
										:key="personGroupVal"
									>
										<TooltipTrigger
											><Badge class="line-clamp-1 gap-0.5" variant="outline">
												<component
													:is="getPersonGroupIcon(personGroup)!.icon"
													v-if="getPersonGroupIcon(personGroup)"
													class="shrink-0"
													:size="12"
												/>
												<span :class="{ 'sr-only': getPersonGroupIcon(personGroup) }"
													>{{ personGroupKey }}:
												</span>
												<span
													class="line-clamp-1"
													:class="{ 'sr-only': getPersonGroupIcon(personGroup)?.hideValue }"
													>{{ trimPrefix(personGroupVal) }}</span
												>
											</Badge></TooltipTrigger
										>
										<TooltipContent class="bg-background capitalize"
											><span
												>{{ personGroupKey }}: {{ trimPrefix(personGroupVal) }}</span
											></TooltipContent
										>
									</Tooltip>
								</template></TooltipProvider
							>
						</div>
					</CollapsibleContent>
				</Collapsible>
				<NuxtLink
					v-for="source in getSources(val)"
					:key="source.link"
					class="flex gap-1 text-primary"
					external
					target="_blank"
					:to="source.link"
				>
					<span class="text-xs">{{ source.short_cit }}</span>
					<span class="sr-only">View Source</span><ExternalLink class="inline-block size-3.5" />
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
