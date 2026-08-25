<script setup lang="ts">
import { ChevronDown, Layers, Ungroup, X } from "@lucide/vue";
import type { Column } from "@tanstack/vue-table";
import {
	type DragChangeEvent,
	type MoveEvent,
	VueDraggableNext as Draggable,
} from "vue-draggable-next";
import type Zod from "zod";

import type { FeatureValueGroupInterface } from "@/stores/use-marker-store";
import type { GeojsonMapSchema } from "@/types/global.ts";
import { ensureFilterValueMap } from "@/utils/filter-value-map";

import type { SelectionEntry } from "./marker-selector.vue";

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

const {
	addValueToFeatureValueGroup,
	buildFeatureValueId,
	createFeatureValueGroup,
	dissolveFeatureValueGroup,
	getFeatureValueGroups,
	removeValueFromFeatureValueGroup,
	renameFeatureValueGroup,
	setMarker,
} = useMarkerStore();
const { markerSettings, markers } = storeToRefs(useMarkerStore());

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

interface LegendEntry {
	key: string;
	parts: Array<string>;
	count?: number;
	markerId: string;
}

interface LegendGroup {
	group: FeatureValueGroupInterface;
	entries: Array<LegendEntry>;
	rowCount: number;
}

interface FeatureLegend {
	feature: ColumnType;
	matchingRowCount: number;
	groups: Array<LegendGroup>;
	ungrouped: Array<LegendEntry>;
	showOtherFeatureValues: boolean;
}

function getLegendEntries(feature: ColumnType): Array<LegendEntry> {
	const toEntry = (parts: Array<string>, count?: number): LegendEntry => {
		const key = parts.join(AND_OPERATOR);
		return { key, parts, count, markerId: buildFeatureValueId(feature.id, key) };
	};
	const combined = getCombinedFilters(feature).map((parts) => toEntry(parts));
	const values =
		feature.getIsFiltered() && hasActiveFilters(feature)
			? getActiveFilterValues(feature).map(([value, count]) => toEntry([value], count))
			: [];
	return [...combined, ...values];
}

const featureLegends = computed<Array<FeatureLegend>>(() => {
	const rows = activeRows.value ?? [];

	return (activeFeatures.value ?? []).map((feature) => {
		const entries = getLegendEntries(feature);
		const entryByKey = new Map(entries.map((entry) => [entry.key, entry]));

		const groups: Array<LegendGroup> = [];
		const groupedKeys = new Set<string>();
		for (const group of getFeatureValueGroups(feature.id)) {
			const groupEntries = group.values
				.map((value) => entryByKey.get(value))
				.filter((entry) => entry !== undefined);

			if (groupEntries.length === 0) continue;
			groupEntries.forEach((entry) => groupedKeys.add(entry.key));
			groups.push({ group, entries: groupEntries, rowCount: 0 });
		}
		let matchingRowCount = 0;
		for (const row of rows) {
			const values = new Set(row.getValue(feature.id) as Array<string>);
			if (values.size > 0) matchingRowCount += 1;
			for (const legendGroup of groups) {
				if (legendGroup.entries.some((entry) => entry.parts.every((part) => values.has(part)))) {
					legendGroup.rowCount += 1;
				}
			}
		}

		return {
			feature,
			matchingRowCount,
			groups,
			ungrouped: entries.filter((entry) => !groupedKeys.has(entry.key)),
			showOtherFeatureValues: shouldShowOtherFeatureValues(feature),
		};
	});
});

const dropTargetId = ref<string | null>(null);

function sortableGroupName(columnId: string) {
	return `legend-${columnId}`;
}

function dropTargetIdFor(columnId: string, key: string) {
	return `${columnId}::${key}`;
}

function onDragEnd() {
	dropTargetId.value = null;
}
function onDragMove(event: MoveEvent<LegendEntry>) {
	// hovering the list the value came from is not a drop worth announcing
	dropTargetId.value =
		event.to === event.from ? null : (event.to.dataset["legendDropTarget"] ?? null);
	return true;
}
function onGroupChange(group: FeatureValueGroupInterface, event: DragChangeEvent<LegendEntry>) {
	if (event.added) addValueToFeatureValueGroup(group.id, event.added.element.key);
}

function onValueChange(
	feature: ColumnType,
	entry: LegendEntry,
	event: DragChangeEvent<LegendEntry>,
) {
	if (event.added) createFeatureValueGroup(feature.id, [entry.key, event.added.element.key]);
}

function onRenameGroup(groupId: string, event: Event) {
	renameFeatureValueGroup(groupId, (event.target as HTMLInputElement).value);
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
				} in featureLegends"
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
					<div
						v-for="{ group, entries, rowCount } in groups"
						:key="group.id"
						class="my-1 rounded-sm border border-dashed border-muted p-1"
						:class="{
							'opacity-45': isMarkerHidden(group.id),
							'border-primary bg-primary/5': dropTargetId === dropTargetIdFor(feature.id, group.id),
						}"
					>
						<div class="flex items-center gap-1.5">
							<MarkerSelector
								:icon-categories="['shapes']"
								:model-value="markers.get(group.id)!"
								:use-popover-portal="true"
								@update:model-value="(props) => updateMarker(props)"
							></MarkerSelector>
							<input
								aria-label="Group name"
								class="w-full min-w-0 grow border-0 bg-transparent p-0 font-medium focus:outline-hidden"
								:value="group.label"
								@change="onRenameGroup(group.id, $event)"
								@keydown.enter.prevent="($event.target as HTMLElement).blur()"
							/>
							<span class="shrink-0 text-on-muted">({{ rowCount }})</span>
							<button
								class="shrink-0 text-on-muted hover:text-black"
								data-legend-controls
								title="Ungroup"
								type="button"
								@click="dissolveFeatureValueGroup(group.id)"
							>
								<span class="sr-only">Ungroup {{ group.label }}</span>
								<Ungroup class="size-3.5"></Ungroup>
							</button>
						</div>
						<Draggable
							class="min-h-3"
							:data-legend-drop-target="dropTargetIdFor(feature.id, group.id)"
							:group="sortableGroupName(feature.id)"
							:list="[...entries]"
							:move="onDragMove"
							:sort="false"
							@change="onGroupChange(group, $event)"
							@end="onDragEnd"
						>
							<div
								v-for="entry in entries"
								:key="entry.key"
								class="ml-1 flex cursor-grab items-center gap-1"
								title="Drag out of the group to ungroup this value"
							>
								<LegendEntryLabel class="grow" :count="entry.count" :parts="entry.parts" />
								<button
									class="shrink-0 text-on-muted hover:text-black"
									data-legend-controls
									title="Remove from group"
									type="button"
									@click="removeValueFromFeatureValueGroup(group.id, entry.key)"
								>
									<span class="sr-only">Remove {{ entry.key }} from {{ group.label }}</span>
									<X class="size-3"></X>
								</button>
							</div>
						</Draggable>
					</div>
					<Draggable
						v-for="entry in ungrouped"
						:key="entry.key"
						class="rounded-sm border border-dashed border-transparent"
						:class="{
							'border-primary bg-primary/5':
								dropTargetId === dropTargetIdFor(feature.id, entry.key),
						}"
						:data-legend-drop-target="dropTargetIdFor(feature.id, entry.key)"
						data-onboarding="legend-value"
						:group="sortableGroupName(feature.id)"
						:list="[entry]"
						:move="onDragMove"
						:sort="false"
						@change="onValueChange(feature, entry, $event)"
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
							<DropdownMenu v-if="groups.length || ungrouped.length > 1">
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
									<template v-if="groups.length">
										<DropdownMenuLabel class="text-xs">Add to group</DropdownMenuLabel>
										<DropdownMenuItem
											v-for="{ group } in groups"
											:key="group.id"
											class="text-xs"
											@select="addValueToFeatureValueGroup(group.id, entry.key)"
											>{{ group.label }}</DropdownMenuItem
										>
									</template>
									<template v-if="ungrouped.length > 1">
										<DropdownMenuLabel class="text-xs">New group with</DropdownMenuLabel>
										<template v-for="other in ungrouped" :key="other.key">
											<DropdownMenuItem
												v-if="other.key !== entry.key"
												class="text-xs"
												@select="createFeatureValueGroup(feature.id, [entry.key, other.key])"
											>
												<LegendEntryLabel :parts="other.parts" />
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
		</CollapsibleContent>
	</Collapsible>
</template>
