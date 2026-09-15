<script setup lang="ts">
import { ChevronDown, Layers } from "@lucide/vue";
import type { Column } from "@tanstack/vue-table";
import {
	type DragChangeEvent,
	type MoveEvent,
	VueDraggableNext as Draggable,
} from "vue-draggable-next";
import type Zod from "zod";

import type { SelectionEntry } from "@/components/marker-selector.vue";
import type { GeojsonMapSchema } from "@/types/global.ts";
import { ensureFilterValueMap } from "@/utils/filter-value-map";

import {
	LEGEND_SORTABLE_GROUP,
	type LegendEntry,
	type LegendGroup,
	legendMemberKey,
	toGroupMember,
} from "./geojson-map-legend.context.ts";

const { getMarkerSVG } = usePetalMarker();

interface Props {
	params: Zod.infer<typeof GeojsonMapSchema>["params"];
}
defineProps<Props>();

const GeojsonStore = useGeojsonStore();

const table = computed(() => GeojsonStore.table);
const activeFeatures = computed(() =>
	table.value?.getVisibleLeafColumns().filter((col) => col.getCanHide()),
);
const activeRows = computed(() => table.value?.getFilteredRowModel().rows);
const collapsibleOpen = ref(true);

const { addValueToFeatureValueGroup, buildFeatureValueId, createFeatureValueGroup, setMarker } =
	useMarkerStore();
const { featureValueGroups, markerSettings, markers } = storeToRefs(useMarkerStore());

type ColumnType = Column<
	{
		id: string;
		type: "Feature";
		geometry: { type: "Point"; coordinates: Array<number> };
		properties: unknown;
	},
	unknown
>;

function getActiveFilterValues(feature: ColumnType) {
	const filterValue = ensureFilterValueMap(feature.getFilterValue());
	return [...feature.getFacetedUniqueValues().entries()].filter(([value, _]) =>
		filterValue.has(value),
	);
}

function getAllFacetsActive(feature: ColumnType) {
	const filterValue = ensureFilterValueMap(feature.getFilterValue());
	for (const [facet, _] of feature.getFacetedUniqueValues()) {
		if (feature.getFilterValue() && !filterValue.has(facet)) {
			return false;
		}
	}
	return true;
}

const { AND_OPERATOR } = useAdvancedQueries();
function getCombinedFilters(column: ColumnType) {
	if (!column.getFilterValue()) return [];
	const filterValue = ensureFilterValueMap(column.getFilterValue());
	return [...filterValue.keys()]
		.filter((filter) => filter.includes(AND_OPERATOR))
		.map((filter) => filter.split(AND_OPERATOR));
}
function hasActiveFilters(column: ColumnType) {
	const filterValue = ensureFilterValueMap(column.getFilterValue());
	return filterValue.size > 0 || filterValue.exclude.size > 0;
}
function updateMarker(markerSelection: SelectionEntry) {
	setMarker(markerSelection);
}
function isMarkerHidden(id: string) {
	return markers.value.get(id)?.hidden ?? false;
}
function shouldShowOtherFeatureValues(feature: ColumnType) {
	return (
		hasActiveFilters(feature) &&
		!getAllFacetsActive(feature) &&
		markerSettings.value.showOtherFeatureValues
	);
}

interface FeatureLegend {
	feature: ColumnType;
	matchingRowCount: number;
	groups: Array<LegendGroup>;
	ungrouped: Array<LegendEntry>;
	showOtherFeatureValues: boolean;
}

function featureLabel(feature: ColumnType) {
	const header = feature.columnDef.header;
	return typeof header === "string" ? header : feature.id;
}

function getLegendEntries(feature: ColumnType): Array<LegendEntry> {
	const label = featureLabel(feature);
	const toEntry = (parts: Array<string>, count?: number): LegendEntry => {
		const key = parts.join(AND_OPERATOR);
		return {
			columnId: feature.id,
			featureLabel: label,
			key,
			parts,
			count,
			markerId: buildFeatureValueId(feature.id, key),
		};
	};
	const combined = getCombinedFilters(feature).map((parts) => toEntry(parts));
	const values =
		feature.getIsFiltered() && hasActiveFilters(feature)
			? getActiveFilterValues(feature).map(([value, count]) => toEntry([value], count))
			: [];
	return [...combined, ...values];
}

/*
 * A group collects values the user wants drawn as one petal. Its members may come from different
 * features, in which case no single feature can host it and it is listed on its own instead.
 */
const legend = computed<{
	features: Array<FeatureLegend>;
	crossFeatureGroups: Array<LegendGroup>;
}>(() => {
	const rows = activeRows.value ?? [];
	const features = activeFeatures.value ?? [];

	const entriesByColumn = new Map<string, Array<LegendEntry>>();
	const entryByMember = new Map<string, LegendEntry>();
	for (const feature of features) {
		const entries = getLegendEntries(feature);
		entriesByColumn.set(feature.id, entries);
		entries.forEach((entry) => {
			entryByMember.set(legendMemberKey(entry.columnId, entry.key), entry);
		});
	}

	const groupedMembers = new Set<string>();
	const groupsByColumn = new Map<string, Array<LegendGroup>>();
	const crossFeatureGroups: Array<LegendGroup> = [];
	for (const group of featureValueGroups.value.values()) {
		// members whose value is not selected right now have nothing to show in the legend
		const entries = group.values
			.map((member) => entryByMember.get(legendMemberKey(member.columnId, member.value)))
			.filter((entry) => entry !== undefined)
			.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
		if (entries.length === 0) continue;
		entries.forEach((entry) => groupedMembers.add(legendMemberKey(entry.columnId, entry.key)));

		const columnIds = new Set(entries.map((entry) => entry.columnId));
		const legendGroup: LegendGroup = {
			group,
			entries,
			rowCount: 0,
			crossFeature: columnIds.size > 1,
		};
		if (legendGroup.crossFeature) crossFeatureGroups.push(legendGroup);
		else {
			const columnId = entries[0]!.columnId;
			const columnGroups = groupsByColumn.get(columnId);
			if (columnGroups) columnGroups.push(legendGroup);
			else groupsByColumn.set(columnId, [legendGroup]);
		}
	}

	const countedGroups = [...crossFeatureGroups, ...[...groupsByColumn.values()].flat()];
	const matchingRowCounts = new Map<string, number>();
	for (const row of rows) {
		const rowValues = new Map<string, Set<string>>();
		const valuesOf = (columnId: string) => {
			let values = rowValues.get(columnId);
			if (!values) {
				values = new Set(row.getValue(columnId) as Array<string>);
				rowValues.set(columnId, values);
			}
			return values;
		};
		for (const feature of features) {
			if (valuesOf(feature.id).size > 0)
				matchingRowCounts.set(feature.id, (matchingRowCounts.get(feature.id) ?? 0) + 1);
		}
		for (const legendGroup of countedGroups) {
			if (
				legendGroup.entries.some((entry) =>
					entry.parts.every((part) => valuesOf(entry.columnId).has(part)),
				)
			)
				legendGroup.rowCount += 1;
		}
	}

	return {
		features: features
			.map((feature) => ({
				feature,
				matchingRowCount: matchingRowCounts.get(feature.id) ?? 0,
				groups: groupsByColumn.get(feature.id) ?? [],
				ungrouped: (entriesByColumn.get(feature.id) ?? [])
					.filter((entry) => !groupedMembers.has(legendMemberKey(entry.columnId, entry.key)))
					.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)),
				showOtherFeatureValues: shouldShowOtherFeatureValues(feature),
			}))
			.filter((f) => f.groups.length > 0 || f.ungrouped.length > 0),
		crossFeatureGroups,
	};
});

/* Every group and every lone value in the legend is a target the value at hand can join. */
const allGroups = computed(() => [
	...legend.value.crossFeatureGroups,
	...legend.value.features.flatMap(({ groups }) => groups),
]);
const allUngrouped = computed(() => legend.value.features.flatMap(({ ungrouped }) => ungrouped));

const dropTargetId = ref<string | null>(null);

function onDragEnd() {
	dropTargetId.value = null;
}
function onDragMove(event: MoveEvent<LegendEntry>) {
	// hovering the list the value came from is not a drop worth announcing
	dropTargetId.value =
		event.to === event.from ? null : (event.to.dataset["legendDropTarget"] ?? null);
	return true;
}

function onValueChange(entry: LegendEntry, event: DragChangeEvent<LegendEntry>) {
	if (event.added)
		createFeatureValueGroup([toGroupMember(entry), toGroupMember(event.added.element)]);
}
</script>

<template>
	<Collapsible
		v-model:open="collapsibleOpen"
		class="flex h-fit w-56 flex-col bg-white p-4 text-xs"
		data-geo-map-legend
		data-onboarding="map-legend"
	>
		<CollapsibleTrigger class="flex w-full justify-between"
			><span class="font-medium">{{ activeRows?.length }} total markers</span
			><ChevronDown
				class="size-4 text-on-muted"
				:class="collapsibleOpen ? '' : 'rotate-180'"
			></ChevronDown
		></CollapsibleTrigger>
		<CollapsibleContent
			class="max-h-full overflow-auto! border-muted"
			:class="{ 'mt-2 border-t pt-1': activeFeatures?.length }"
		>
			<div
				v-for="{
					feature,
					matchingRowCount,
					groups,
					ungrouped,
					showOtherFeatureValues,
				} in legend.features"
				:key="feature.id"
				class="my-1"
			>
				<div
					class="my-2 flex items-start gap-2"
					:class="{ 'opacity-45': isMarkerHidden(feature.id) }"
				>
					<span>{{ feature.columnDef.header }} ({{ matchingRowCount }})</span>
					<MarkerSelector
						data-feature-marker-selector
						:hide-marker="true"
						:icon-categories="['shapes']"
						:model-value="markers.get(feature.id)!"
						:use-popover-portal="true"
						@update:model-value="(props) => updateMarker(props)"
					></MarkerSelector>
				</div>
				<div class="ml-5">
					<GeojsonMapLegendGroup
						v-for="legendGroup in groups"
						:key="legendGroup.group.id"
						:drop-target-id="dropTargetId"
						:legend-group="legendGroup"
						@drag-end="onDragEnd"
						@drag-move="(target) => (dropTargetId = target)"
					></GeojsonMapLegendGroup>
					<Draggable
						v-for="entry in ungrouped"
						:key="legendMemberKey(entry.columnId, entry.key)"
						class="rounded-sm border border-dashed border-transparent"
						:class="{
							'border-primary bg-primary/5':
								dropTargetId === legendMemberKey(entry.columnId, entry.key),
						}"
						:data-legend-drop-target="legendMemberKey(entry.columnId, entry.key)"
						data-onboarding="legend-value"
						:group="LEGEND_SORTABLE_GROUP"
						:list="[entry]"
						:move="onDragMove"
						:sort="false"
						@change="onValueChange(entry, $event)"
						@end="onDragEnd"
					>
						<div
							class="my-0 flex cursor-grab items-center gap-2"
							:class="{ 'opacity-45': isMarkerHidden(entry.markerId) }"
							title="Drag another value onto this one to group them"
						>
							<MarkerSelector
								:icon-categories="['shapes']"
								:model-value="markers.get(entry.markerId)!"
								:use-popover-portal="true"
								@update:model-value="(props) => updateMarker(props)"
							></MarkerSelector>
							<LegendEntryLabel class="grow" :count="entry.count" :parts="entry.parts" />
							<DropdownMenu v-if="allGroups.length || allUngrouped.length > 1">
								<DropdownMenuTrigger
									class="shrink-0 text-on-muted sr-only hover:text-black"
									data-legend-controls
									draggable="false"
									:title="`Group ${entry.key} with other values`"
								>
									<span class="sr-only">Group {{ entry.key }} with other values</span>
									<Layers class="size-3.5"></Layers>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<template v-if="allGroups.length">
										<DropdownMenuLabel class="text-xs">Add to group</DropdownMenuLabel>
										<DropdownMenuItem
											v-for="{ group } in allGroups"
											:key="group.id"
											class="text-xs"
											@select="addValueToFeatureValueGroup(group.id, toGroupMember(entry))"
											>{{ group.label }}</DropdownMenuItem
										>
									</template>
									<template v-if="allUngrouped.length > 1">
										<DropdownMenuLabel class="text-xs">New group with</DropdownMenuLabel>
										<template v-for="other in allUngrouped" :key="other.markerId">
											<DropdownMenuItem
												v-if="
													legendMemberKey(other.columnId, other.key) !==
													legendMemberKey(entry.columnId, entry.key)
												"
												class="text-xs"
												@select="
													createFeatureValueGroup([toGroupMember(entry), toGroupMember(other)])
												"
											>
												<LegendEntryLabel
													:feature-label="
														other.columnId === entry.columnId ? undefined : other.featureLabel
													"
													:parts="other.parts"
												/>
											</DropdownMenuItem>
										</template>
									</template>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</Draggable>
					<div
						v-if="showOtherFeatureValues"
						class="flex items-center gap-2"
						:class="{ 'opacity-45': isMarkerHidden(feature.id) }"
					>
						<!-- eslint-disable vue/no-v-html -->
						<svg
							class="mt-0.5 size-3.5 shrink-0"
							v-html="getMarkerSVG({ id: feature.id, strokeOnly: true }).outerHTML"
						></svg>
						<span>Other feature values</span>
					</div>
				</div>
			</div>
			<div
				v-if="legend.crossFeatureGroups.length"
				class="my-1 border-muted"
				:class="{ 'mt-2 border-t pt-2': legend.features.length }"
				data-legend-cross-feature-groups
			>
				<span class="font-normal">Groups across features</span>
				<GeojsonMapLegendGroup
					v-for="legendGroup in legend.crossFeatureGroups"
					:key="legendGroup.group.id"
					:drop-target-id="dropTargetId"
					:legend-group="legendGroup"
					@drag-end="onDragEnd"
					@drag-move="(target) => (dropTargetId = target)"
				></GeojsonMapLegendGroup>
			</div>
		</CollapsibleContent>
	</Collapsible>
</template>
