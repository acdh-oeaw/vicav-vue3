<script setup lang="ts">
import { debounce } from "@acdh-oeaw/lib";
import {
	ArrowDownAZ,
	ChartNoAxesColumnIncreasing,
	ChevronDown,
	ChevronRight,
	Volume2,
	VolumeX,
} from "@lucide/vue";
import type { Row, Table as TanstackTable } from "@tanstack/vue-table";

import { useDataListMapStore } from "@/stores/use-data-list-map-store.ts";
import type { DataTypesEnum, SimpleMetadataListState } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";
import {
	getSimpleMetadataFacetValueLabel,
	type SimpleMetadataFacetSelections,
} from "@/utils/simple-metadata-facets.ts";
import { createSimpleMetadataTable } from "@/utils/simple-metadata-table.ts";

const props = defineProps<{
	datasetId?: string;
	items: Array<simpleTEIMetadata>;
	defaultFacets?: SimpleMetadataFacetSelections;
	dataType: Extract<DataTypesEnum, "CorpusText" | "SampleText" | "Feature" | "Profile">;
	targetType: Extract<DataTypesEnum, "CorpusText" | "SampleText" | "Feature" | "Profile">;
	searchInputId: string;
	showAudioAvailability: boolean;
	requireTeiAvailabilityForLink: boolean;
	listState?: SimpleMetadataListState;
}>();
const emit = defineEmits<{
	"update:listState": [listState: SimpleMetadataListState | undefined];
	"update:visibleItems": [items: Array<simpleTEIMetadata>];
}>();

const openNewWindowFromAnchor = useAnchorClickHandler();
const dataListMapStore = useDataListMapStore();
const model = props.datasetId ? dataListMapStore.datasets.get(props.datasetId)?.model : undefined;
const {
	table,
	globalFilter,
	columnFilters,
	sortMode,
	serializeListState,
	normalizePlaceSortValue,
	compareStringValues,
	comparePlaceUndefinedPosition,
} =
	model ??
	createSimpleMetadataTable({
		getItems: () => props.items,
		dataType: props.dataType,
		defaultFacets: props.defaultFacets,
		listState: props.listState,
	});
const selectedSortMode = computed<typeof sortMode.value | undefined>({
	get: () => sortMode.value,
	set: (value) => {
		if (value != null) sortMode.value = value;
	},
});
const emitListStateUpdate = debounce(() => {
	emit("update:listState", serializeListState());
}, 150);
watch([globalFilter, sortMode, columnFilters], emitListStateUpdate, {
	deep: true,
	immediate: true,
});
watch(
	() => table.getFilteredRowModel().flatRows.map((row) => row.original),
	(items) => emit("update:visibleItems", items),
	{ deep: true, immediate: true },
);
const facetColumnIds = [
	"country",
	"region",
	"settlement",
	"category",
	"audioAvailability",
	"@hasTEIw",
];
const placeHierarchyColumnIds = ["country", "region", "settlement"];
const hideSingleValueFilterColumnIds = [
	...placeHierarchyColumnIds,
	"category",
	"audioAvailability",
	"@hasTEIw",
];

interface FacetedColumn {
	getFacetedUniqueValues: () => Map<unknown, number>;
}

interface DisplayRow {
	row: Row<simpleTEIMetadata>;
	depth: number;
}

const visibleFacetColumnIds = computed(() => {
	return facetColumnIds.filter((columnId) => {
		const column = table.getColumn(columnId);

		return column != null && !hasSingleFilterValue(columnId, column);
	});
});

const displayRows = computed<Array<DisplayRow>>(() => {
	return flattenDisplayRows(table.getPreExpandedRowModel().rows);
});

function flattenDisplayRows(
	rows: Array<Row<simpleTEIMetadata>>,
	skippedAncestorCount = 0,
): Array<DisplayRow> {
	return rows.toSorted(compareRowsBySortMode).flatMap((row) => {
		const isEmptyPlaceGroup = isEmptyPlaceHierarchyGroup(row);
		const nextSkippedAncestorCount = skippedAncestorCount + (isEmptyPlaceGroup ? 1 : 0);
		const childRows =
			row.subRows.length > 0 && (row.getIsExpanded() || isEmptyPlaceGroup)
				? flattenDisplayRows(row.subRows, nextSkippedAncestorCount)
				: [];

		if (isEmptyPlaceGroup) return childRows;

		return [{ row, depth: row.depth - skippedAncestorCount }, ...childRows];
	});
}

function compareRowsBySortMode(a: Row<simpleTEIMetadata>, b: Row<simpleTEIMetadata>): number {
	if (sortMode.value === "hit-count") return compareRowsByHitCount(a, b);

	return compareRowsAlphabetically(a, b);
}

function compareRowsByHitCount(a: Row<simpleTEIMetadata>, b: Row<simpleTEIMetadata>): number {
	const placeUndefinedPosition = compareRowsByPlaceUndefinedPosition(a, b);

	if (placeUndefinedPosition !== 0) return placeUndefinedPosition;

	if (a.getIsGrouped() && b.getIsGrouped()) {
		const countComparison = countLeafRows(b) - countLeafRows(a);

		if (countComparison !== 0) return countComparison;
	}

	return compareRowsAlphabetically(a, b);
}

function compareRowsAlphabetically(a: Row<simpleTEIMetadata>, b: Row<simpleTEIMetadata>): number {
	const placeUndefinedPosition = compareRowsByPlaceUndefinedPosition(a, b);

	if (placeUndefinedPosition !== 0) return placeUndefinedPosition;
	if (a.getIsGrouped() && !b.getIsGrouped()) return -1;
	if (!a.getIsGrouped() && b.getIsGrouped()) return 1;
	if (!a.getIsGrouped() && !b.getIsGrouped()) {
		return compareStringValues(a.original.label, b.original.label);
	}

	return compareStringValues(getRowGroupSortValue(a), getRowGroupSortValue(b));
}

function compareRowsByPlaceUndefinedPosition(
	a: Row<simpleTEIMetadata>,
	b: Row<simpleTEIMetadata>,
): number {
	if (!a.getIsGrouped() || !b.getIsGrouped()) return 0;
	if (a.groupingColumnId !== b.groupingColumnId) return 0;
	if (a.groupingColumnId == null || !placeHierarchyColumnIds.includes(a.groupingColumnId)) return 0;

	const groupingColumnId = a.groupingColumnId;

	return comparePlaceUndefinedPosition(a.getValue(groupingColumnId), b.getValue(groupingColumnId));
}

function getRowGroupSortValue(row: Row<simpleTEIMetadata>): string {
	if (row.groupingColumnId == null) return "";
	if (placeHierarchyColumnIds.includes(row.groupingColumnId)) {
		return normalizePlaceSortValue(String(row.getValue(row.groupingColumnId) ?? ""));
	}

	return String(row.getValue(row.groupingColumnId) ?? "");
}

function formatGroupValue(columnId: string | undefined, value: unknown): string {
	if (typeof value === "string" && value.length > 0) return value.replace(/^zzz_/, "");
	if (typeof value === "number") return value.toString();

	if (columnId === "country") return "Unspecified country";
	if (columnId === "region") return "Unspecified region";
	if (columnId === "settlement") return "Unspecified place";

	return "Unspecified";
}

function hasSingleFilterValue(columnId: string, column: FacetedColumn): boolean {
	if (!hideSingleValueFilterColumnIds.includes(columnId)) return false;

	const values = [...column.getFacetedUniqueValues().keys()];

	return values.length <= 1;
}

function shouldPutUndefinedFacetLast(columnId: string): boolean {
	return placeHierarchyColumnIds.includes(columnId);
}

function isEmptyPlaceHierarchyGroup(row: Row<simpleTEIMetadata>): boolean {
	if (!row.getIsGrouped()) return false;
	if (row.groupingColumnId == null) return false;
	if (!placeHierarchyColumnIds.includes(row.groupingColumnId)) return false;

	return row.getValue(row.groupingColumnId) === "";
}

function countLeafRows(row: Row<simpleTEIMetadata>): number {
	return row.getLeafRows().filter((row) => !row.getIsGrouped()).length;
}

function canOpenItem(item: simpleTEIMetadata): boolean {
	return !props.requireTeiAvailabilityForLink || item["@hasTEIw"] === "true";
}

function formatFacetValue(columnId: string, value: string): string {
	return getSimpleMetadataFacetValueLabel(columnId, value);
}
</script>

<template>
	<div class="grid size-full grid-rows-[auto_1fr] overflow-hidden">
		<div class="flex flex-wrap items-center justify-between gap-2 p-2">
			<div class="flex flex-wrap items-center gap-2">
				<TooltipProvider :delay-duration="100">
					<ToggleGroup
						v-model="selectedSortMode"
						aria-label="Sort list"
						class="shrink-0"
						type="single"
						variant="outline"
					>
						<Tooltip>
							<TooltipTrigger as-child>
								<ToggleGroupItem
									aria-label="Sort by hit count"
									class="h-8 min-w-8 px-2 hover:bg-primary hover:text-on-primary"
									:class="
										sortMode === 'hit-count'
											? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary'
											: ''
									"
									value="hit-count"
								>
									<ChartNoAxesColumnIncreasing class="size-4" />
								</ToggleGroupItem>
							</TooltipTrigger>
							<TooltipContent class="border-black bg-black text-white">
								Sort branches by hit count.
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger as-child>
								<ToggleGroupItem
									aria-label="Sort alphabetically"
									class="h-8 min-w-8 px-2 hover:bg-primary hover:text-on-primary"
									:class="
										sortMode === 'alphabetical'
											? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary'
											: ''
									"
									value="alphabetical"
								>
									<ArrowDownAZ class="size-4" />
								</ToggleGroupItem>
							</TooltipTrigger>
							<TooltipContent class="border-black bg-black text-white">
								Sort branches alphabetically.
							</TooltipContent>
						</Tooltip>
					</ToggleGroup>
				</TooltipProvider>
				<label class="text-sm font-medium whitespace-nowrap" :for="searchInputId">Search:</label>
				<input
					:id="searchInputId"
					v-model="globalFilter"
					class="h-8 w-56 rounded-md border border-input px-2"
					type="search"
				/>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-2">
				<DataTableActiveFilters
					:format-value="formatFacetValue"
					:table="table as unknown as TanstackTable<never>"
				/>
				<div class="flex flex-wrap items-center gap-4">
					<span
						v-for="columnId in visibleFacetColumnIds"
						:key="columnId"
						class="inline-flex items-center gap-1.5 text-sm"
					>
						<span>{{ table.getColumn(columnId)?.columnDef.header }}</span>
						<DataTableFacetedFilter
							v-if="table.getColumn(columnId)"
							:column="table.getColumn(columnId)!"
							:display-value="(value) => formatFacetValue(columnId, value)"
							:filter-label="String(table.getColumn(columnId)?.columnDef.header ?? columnId)"
							:sort-mode="sortMode"
							:sort-value="normalizePlaceSortValue"
							:undefined-values-last="shouldPutUndefinedFacetLast(columnId)"
						/>
					</span>
				</div>
				<div class="text-sm">{{ table.getFilteredRowModel().flatRows.length }} results</div>
			</div>
		</div>
		<div class="relative isolate overflow-auto p-2">
			<div v-if="displayRows.length === 0" class="p-4 text-center text-sm">No results.</div>
			<ul v-else>
				<li
					v-for="{ row, depth } in displayRows"
					:key="row.id"
					class="py-0.5 text-base"
					:style="{ marginLeft: `${depth * 1.25}rem` }"
				>
					<button
						v-if="row.getIsGrouped()"
						:aria-expanded="row.getIsExpanded()"
						class="inline-flex items-center gap-2 py-1 font-semibold"
						type="button"
						@click="row.toggleExpanded()"
					>
						<ChevronDown v-if="row.getIsExpanded()" class="size-4" />
						<ChevronRight v-else class="size-4" />
						<span>{{
							formatGroupValue(row.groupingColumnId, row.getValue(row.groupingColumnId!))
						}}</span>
						<span class="text-sm font-normal">({{ countLeafRows(row) }})</span>
					</button>
					<div v-else class="flex items-center">
						<a
							v-if="canOpenItem(row.original)"
							class="text-primary underline"
							:data-target-type="targetType"
							:data-text-id="row.original.id"
							href="#"
							@click="openNewWindowFromAnchor"
						>
							{{ row.original.label }}
						</a>
						<span v-else>{{ row.original.label }}</span>
						<span class="ml-2 text-sm text-muted-foreground">({{ row.original.id }})</span>
						<span> &nbsp; </span>
						<template v-if="showAudioAvailability">
							<span
								v-if="row.original.audioAvailability === 'free'"
								title="Audio recording is publicly available"
							>
								<Volume2 class="mx-2 mt-0.5 size-5" />
							</span>
							<span v-else title="Audio recording is restricted">
								<VolumeX class="mx-2 mt-0.5 size-5" />
							</span>
						</template>
					</div>
				</li>
			</ul>
		</div>
	</div>
</template>
