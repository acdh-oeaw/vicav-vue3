<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";

import { BarChart } from "@/components/ui/chart-bar";
import type { FeatureStatisticsWindowItem } from "@/types/global";

interface Props {
	params: FeatureStatisticsWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const geojsonStore = useGeojsonStore();
const {
	wibarabGeojsonUrl,
	getTaxonomyTree,
	getSortedTaxonomyChildren,
	getSortedTaxonomyFeatureValues,
} = geojsonStore;
const { tables } = storeToRefs(geojsonStore);

const table = computed(() => tables.value.get(wibarabGeojsonUrl) as Table<unknown> | undefined);

const featureLabel = computed(() => {
	const header = table.value?.getColumn(params.value.featureId)?.columnDef.header;
	return typeof header === "string" ? header : params.value.featureId;
});

interface ValueCounts {
	tribal: number;
	nontribal: number;
}

/** Count tribal/nontribal entries per feature value across all rows. */
const valueCounts = computed(() => {
	const results: Record<string, ValueCounts> = {};
	if (!table.value) return results;
	table.value
		.getCoreRowModel()
		.flatRows.map(
			(row) =>
				(
					row.original as Record<
						string,
						Record<string, Record<string, Array<Record<string, string>>>>
					>
				).properties![params.value.featureId],
		)
		.forEach((row) => {
			Object.entries(row ?? {}).forEach(([key, val]) => {
				if (!(key in results)) results[key] = { tribal: 0, nontribal: 0 };
				val.forEach((entry) => {
					if ("tribe" in entry) results[key]!.tribal++;
					else results[key]!.nontribal++;
				});
			});
		});
	return results;
});

const facets = computed<Array<[string, number]>>(() =>
	Object.entries(valueCounts.value).map(([key, val]) => [key, val.tribal + val.nontribal]),
);

interface ChartRow extends ValueCounts {
	key: string;
	isHeading: boolean;
	[k: string]: unknown;
}

/**
 * Flatten the feature's taxonomy tree into a depth-first ordered list of chart rows.
 * Taxonomy nodes become label-only "heading" rows; the feature values underneath them
 * are indented one level deeper and carry the actual tribal/nontribal bar values.
 */
const chartData = computed<Array<ChartRow>>(() => {
	if (!table.value) return [];
	const counts = valueCounts.value;
	const tree = getTaxonomyTree(params.value.featureId, Object.keys(counts));
	const rows: Array<ChartRow> = [];

	// `headingText` is the label to show for this node's heading row, mirroring the
	// feature selection dialog: an empty string means the node is an invisible
	// wrapper (e.g. the top-level featureId node, or the "no taxonomy" group), so
	// it gets no heading row and its contents are not indented further.
	const emitEntry = (entry: TaxonomyTreeEntry, depth: number, headingText: string) => {
		let childDepth = depth;
		if (headingText) {
			rows.push({
				key: headingText,
				isHeading: true,
				tribal: 0,
				nontribal: 0,
			});
			childDepth = depth + 1;
		}
		for (const [value] of getSortedTaxonomyFeatureValues(entry, facets.value) ?? []) {
			rows.push({
				key: value,
				isHeading: false,
				tribal: counts[value]?.tribal ?? 0,
				nontribal: counts[value]?.nontribal ?? 0,
			});
		}
		for (const [childKey, child] of getSortedTaxonomyChildren(entry, facets.value) ?? []) {
			// Nested taxonomy nodes are always headings (the dialog labels them by key,
			// displaying `label ?? key`); fall back to the key when the label is blank.
			emitEntry(child, childDepth, child.label || childKey);
		}
	};

	for (const [, entry] of tree.entries()) {
		// Top-level nodes use their own label, so the featureId wrapper (label "") and
		// the untaxonomised group (label undefined) stay flat and unheaded.
		emitEntry(entry, 0, entry.label ?? "");
	}
	return rows;
});

function categoryFormatter(category: "tribal" | "nontribal" | string) {
	return (
		{
			tribal: "Tribal",
			nontribal: "Non tribal",
		}[category] ?? category
	);
}
</script>

<template>
	<div class="size-full overflow-auto p-3">
		<h2 class="mb-3 text-sm font-semibold">Number of entries per value of "{{ featureLabel }}"</h2>
		<BarChart
			v-if="chartData.length > 0"
			:categories="['tribal', 'nontribal']"
			:category-formatter="categoryFormatter"
			:data="chartData"
			:emphasize="(d) => d.isHeading === true"
			index="key"
			orientation="horizontal"
		/>
		<p v-else class="text-sm text-on-muted">No entries available for this feature.</p>
	</div>
</template>
