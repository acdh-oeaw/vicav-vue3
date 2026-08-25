<script setup lang="ts">
import {
	Contact,
	ExternalLink,
	Languages,
	Layers,
	type LucideIcon,
	Mars,
	MessageSquare,
	UsersRound,
	Venus,
	VenusAndMars,
} from "@lucide/vue";
import type { Column } from "@tanstack/vue-table";
import type { DefineComponent } from "vue";
import CrossOutlineIcon from "vue-material-design-icons/CrossOutline.vue";
import StarCrescentIcon from "vue-material-design-icons/StarCrescent.vue";
import StarDavidIcon from "vue-material-design-icons/StarDavid.vue";

import type { WindowItem } from "@/types/global.ts";

const { featureValueTaxonomy } = storeToRefs(useGeojsonStore());

const props = defineProps<{
	value?: Record<string, unknown>;
	highlightedValues?: Array<string>;
	column: Column<PatchedFeatureType>;
	fullEntry: PatchedFeatureType["properties"];
}>();

function getSources(featureValueEntry: unknown) {
	return (featureValueEntry as Record<string, Record<string, Record<string, string>>>).source;
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
		Jews: StarDavidIcon,
		Christians: CrossOutlineIcon,
		"#default": StarCrescentIcon,
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
const nonPersonGroupKeys = ["source"];
const hiddenKeys = ["remarks", "exceptions", "constraints", "source_representations", "resp"];
const badgeKeys = ["tribe", "religion"];
function getPersonGroups(featureValueEntry: unknown) {
	const personGroups = (featureValueEntry as Array<Record<string, Array<string>>>)
		.flatMap((entry) => Object.entries(entry ?? {}))
		.filter(([key]) => !nonPersonGroupKeys.includes(key))
		.flatMap(([key, val]) => {
			if (Array.isArray(val))
				return val.map(
					(entry) => {
						if (typeof entry === "object")
							return Object.entries(entry).map(([example, translation]) => ({
								[key]: `${example} (${translation})`,
							}));
						return { [key]: entry };
					},
					{} as Record<string, string>,
				);
			else {
				return { [key]: val };
			}
		})
		.flat();
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
				return { icon: iconMap[key][personGroup[key]!], hideValue: key !== "religion" };
			else if (iconMap[key]["#default"])
				return { icon: iconMap[key]["#default"], hideValue: false };
		}
	}
	return null;
}
function trimPrefix(str: string) {
	if (typeof str === "string") return str.replace(/#|pgr:/, "");
	else return str;
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

const { getMarkerSVG } = usePetalMarker();
const { resolveMarkerId } = useMarkerStore();
const { featureValueGroups, markerSettings, markers } = storeToRefs(useMarkerStore());
const { AND_OPERATOR } = useAdvancedQueries();

const flattenedHighlightedValues = computed(() => {
	return props.highlightedValues?.flatMap((val) => val.split(AND_OPERATOR)) ?? [];
});

interface PetalEntry {
	id: string;
	strokeOnly?: boolean;
}

function getPetalEntry(featureValue: string): PetalEntry | null {
	const visibleEntry = (entry: PetalEntry) => {
		return markers.value.get(entry.id)?.hidden ? null : entry;
	};

	const entry = visibleEntry({ id: resolveMarkerId(props.column.id, featureValue) });

	if (props.highlightedValues?.includes(featureValue) && entry)
		// value is directly selected
		return entry;
	else {
		// check if value is selected in combined filter ("{x} AND {y}")
		const combined = props.highlightedValues?.find(
			(val) => val.includes(AND_OPERATOR) && val.split(AND_OPERATOR).includes(featureValue),
		);
		if (combined) return visibleEntry({ id: resolveMarkerId(props.column.id, combined) });
	}
	if (markerSettings.value.showOtherFeatureValues && (props.highlightedValues?.length ?? 0) > 0)
		return visibleEntry({ id: props.column.id, strokeOnly: true });
	else return null;
}

function getGroupId(entry: PetalEntry | null) {
	if (!entry || entry.strokeOnly) return undefined;
	return featureValueGroups.value.has(entry.id) ? entry.id : undefined;
}

const sortedValues = computed(() => {
	return Object.entries(props.value ?? {}).toSorted(([a, _a], [b, _b]) => {
		const indexA = flattenedHighlightedValues.value?.includes(String(a)) ? -1 : 1;
		const indexB = flattenedHighlightedValues.value?.includes(String(b)) ? -1 : 1;
		return indexA === indexB ? a.localeCompare(b) : indexA - indexB;
	}) as Array<[string, Array<Record<string, unknown>>]>;
});

interface CellValue {
	key: string;
	val: Array<Record<string, unknown>>;
}

interface CellRowBase {
	id: string;
	tooltip: string;
	/** feature value the petal is resolved from; every value of a group yields the same one */
	markerKey: string;
	values: Array<CellValue>;
	petalEntry: PetalEntry | null;
	/** set while the row stands for a custom group, whether collapsed into it or badged with it */
	groupId?: string;
	/** the row carries every member of its group instead of a single value */
	collapsed?: boolean;
}

interface PersonGroupBadge {
	id: string;
	group: Record<string, string>;
	icon: ReturnType<typeof getPersonGroupIcon>;
}

interface CellRow extends CellRowBase {
	label: string;
	groupLabel?: string;
	highlighted: boolean;
	hasDetails: boolean;
	badgePersonGroups: Array<PersonGroupBadge>;
	detailPersonGroups: Array<PersonGroupBadge>;
	sources: Array<Record<string, string>>;
}

function personGroupId(personGroup: Record<string, string>) {
	return Object.entries(personGroup)
		.map(([key, value]) => `${key}:${String(value)}`)
		.join("|");
}

function toBadge(group: Record<string, string>): PersonGroupBadge {
	return { id: personGroupId(group), group, icon: getPersonGroupIcon(group) };
}

function getRowPersonGroups(row: CellRowBase) {
	const seen = new Set<string>();
	return row.values
		.flatMap((entry) => getPersonGroups(entry.val))
		.filter((personGroup) => {
			const id = personGroupId(personGroup);
			if (seen.has(id)) return false;
			seen.add(id);
			return true;
		})
		.toSorted((a, b) => personGroupId(a).localeCompare(personGroupId(b)));
}

function getRowSources(row: CellRowBase) {
	const sources = row.values.flatMap((entry) => Object.values(getSources(entry.val) ?? {}));
	return [...new Map(sources.map((source) => [source.link, source])).values()];
}

function groupLabel(groupId: string, fallback: string) {
	const label = featureValueGroups.value.get(groupId)?.label;
	return label?.trim() ? label : fallback;
}

const cellRows = computed<Array<CellRow>>(() => {
	const rows: Array<CellRowBase> = [];
	const collapsedGroups = new Map<string, CellRowBase>();

	for (const [key, val] of sortedValues.value) {
		const petalEntry = getPetalEntry(key);
		const groupId = getGroupId(petalEntry);

		if (groupId && !showAllDetails.value) {
			const collapsed = collapsedGroups.get(groupId);
			if (collapsed) {
				collapsed.values.push({ key, val });
				collapsed.tooltip = collapsed.values.map((entry) => entry.key).join(", ");
				continue;
			}
			const row: CellRowBase = {
				id: groupId,
				tooltip: key,
				markerKey: key,
				values: [{ key, val }],
				petalEntry,
				groupId,
				collapsed: true,
			};
			collapsedGroups.set(groupId, row);
			rows.push(row);
			continue;
		}

		rows.push({
			id: key,
			tooltip: key,
			markerKey: key,
			values: [{ key, val }],
			petalEntry,
			groupId,
		});
	}

	return rows.map((row) => {
		const personGroups = getRowPersonGroups(row);
		return {
			...row,
			label: row.collapsed && row.groupId ? groupLabel(row.groupId, row.markerKey) : row.markerKey,
			groupLabel: !row.collapsed && row.groupId ? groupLabel(row.groupId, row.groupId) : undefined,
			highlighted:
				flattenedHighlightedValues.value.includes(row.markerKey) && row.petalEntry !== null,
			hasDetails: personGroups.length > 0 || getRowSources(row).length > 0,
			badgePersonGroups: personGroups
				.filter((group) => Object.keys(group).some((key) => badgeKeys.includes(key)))
				.map(toBadge),
			detailPersonGroups: personGroups
				.filter(
					(group) =>
						!badgeKeys.some((key) => group[key]) &&
						Object.keys(group).every((key) => !hiddenKeys.includes(key)),
				)
				.map(toBadge),
			sources: getRowSources(row),
		};
	});
});

const openOrUpdateWindow = useOpenOrUpdateWindow();
function onRowClick(row: CellRow) {
	openOrUpdateWindow(
		{
			targetType: "FeatureValue",
			params: {
				values: row.values.flatMap(({ key, val }) =>
					val.map((v) => ({
						...v,
						title: key,
						place: props.fullEntry.name,
						feature: props.column.columnDef.header,
						featureId: props.column.columnDef.id,
						taxonomy: featureValueTaxonomy.value.get(`${props.column.columnDef.id}.${key}`)?.label,
					})),
				),
				showCitation: false,
			},
		} as unknown as WindowItem,
		`Feature Value Observation: ${row.label} | ${props.fullEntry.name}`,
	);
}
</script>

<template>
	<div :class="{ 'flex flex-wrap gap-x-2': !showAllDetails, 'gap-2': showAllDetails }">
		<div
			v-for="row in cellRows"
			:key="row.id"
			class="my-0.5"
			:class="{ 'inline-block': !infoOpen[row.id], block: infoOpen[row.id] }"
		>
			<div
				class="items-center gap-y-0"
				:class="{
					'inline-flex gap-x-0.5': !infoOpen[row.id],
					'flex flex-wrap gap-x-2': infoOpen[row.id],
				}"
			>
				<!-- eslint-disable vue/no-v-html -->
				<svg
					v-if="row.petalEntry !== null"
					class="size-3.5 shrink-0"
					v-html="getMarkerSVG(row.petalEntry).outerHTML"
				></svg>
				<Button
					class="h-auto shrink-0 truncate p-0 text-black!"
					:class="{ 'font-medium': row.highlighted, 'font-normal': !row.highlighted }"
					data-onboarding="feature-value-link"
					variant="link"
					@click="onRowClick(row)"
					><Ellipsis
						cut-words="first"
						:max-length="!infoOpen[row.id] ? 15 : 30"
						:text="row.label"
						:tooltip-content="row.tooltip"
					></Ellipsis
				></Button>
				<TooltipProvider v-if="row.groupLabel">
					<Tooltip>
						<TooltipTrigger
							><Badge class="ml-0.5 line-clamp-1 gap-1" variant="outline">
								<Layers class="shrink-0" :size="12" />
								<span class="sr-only">Group: </span>
								<span class="line-clamp-1">{{ row.groupLabel }}</span>
							</Badge></TooltipTrigger
						>
						<TooltipContent class="bg-background"
							><span>Group: {{ row.groupLabel }}</span></TooltipContent
						>
					</Tooltip>
				</TooltipProvider>
				<TooltipProvider>
					<template v-for="badge in row.badgePersonGroups" :key="badge.id">
						<Tooltip v-for="(personGroupVal, personGroupKey) in badge.group" :key="personGroupVal">
							<TooltipTrigger
								><Badge
									class="ml-0.5 line-clamp-1"
									:class="{ 'gap-1': !badge.icon?.hideValue && infoOpen[row.id] }"
									variant="outline"
								>
									<component :is="badge.icon.icon" v-if="badge.icon" class="shrink-0" :size="12" />
									<span :class="{ 'sr-only': badge.icon }">{{ personGroupKey }}: </span>
									<span
										class="line-clamp-1"
										:class="{
											'sr-only':
												personGroupKey !== 'tribe' && (badge.icon?.hideValue || !infoOpen[row.id]),
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
					v-if="row.hasDetails && infoOpen"
					v-model:open="infoOpen[row.id]"
					class="flex gap-2"
				>
					<CollapsibleContent orientation="horizontal"
						><div class="inline-flex items-center gap-2 text-ellipsis">
							<TooltipProvider>
								<template v-for="badge in row.detailPersonGroups" :key="badge.id">
									<Tooltip
										v-for="(personGroupVal, personGroupKey) in badge.group"
										:key="personGroupVal"
									>
										<TooltipTrigger
											><Badge class="line-clamp-1 gap-0.5" variant="outline">
												<component
													:is="badge.icon.icon"
													v-if="badge.icon"
													class="shrink-0"
													:size="12"
												/>
												<span :class="{ 'sr-only': badge.icon }">{{ personGroupKey }}: </span>
												<span class="line-clamp-1" :class="{ 'sr-only': badge.icon?.hideValue }">{{
													trimPrefix(personGroupVal)
												}}</span>
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
					v-for="source in row.sources"
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
