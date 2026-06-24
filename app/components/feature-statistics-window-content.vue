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

type ViewMode = "value" | "tribe" | "country";
const viewMode = ref<ViewMode>("value");

interface GroupedChart {
	categories: Array<string>;
	rows: Array<Record<string, unknown>>;
}

type FeatureEntries = Record<string, Array<Record<string, unknown>>>;

function buildGroupedChart(
	contribute: (
		properties: Record<string, unknown>,
		featureEntries: FeatureEntries,
		add: (group: string, featureValue: string, count: number) => void,
	) => void,
): GroupedChart {
	if (!table.value) return { categories: [], rows: [] };
	const counts: Record<string, Record<string, number>> = {};
	const featureTotals: Record<string, number> = {};
	const add = (group: string, value: string, count: number) => {
		counts[group] ??= {};
		counts[group]![value] = (counts[group]![value] ?? 0) + count;
		featureTotals[value] = (featureTotals[value] ?? 0) + count;
	};
	table.value.getCoreRowModel().flatRows.forEach((row) => {
		const properties = (row.original as { properties?: Record<string, unknown> }).properties ?? {};
		contribute(properties, (properties[params.value.featureId] as FeatureEntries) ?? {}, add);
	});

	const categories = Object.entries(featureTotals)
		.sort((a, b) => b[1] - a[1])
		.map(([value]) => value);
	const total = (vals: Record<string, number>) =>
		Object.values(vals).reduce((sum, n) => sum + n, 0);
	const rows = Object.entries(counts)
		.sort((a, b) => total(b[1]) - total(a[1]))
		.map(([group, vals]) => ({ key: group, ...vals }));

	return { categories, rows };
}

const tribeChart = computed<GroupedChart>(() =>
	buildGroupedChart((_properties, featureEntries, add) => {
		Object.entries(featureEntries).forEach(([value, entries]) => {
			entries.forEach((entry) => {
				const tribe = entry.tribe;
				if (tribe == null) return;
				const tribes = Array.isArray(tribe) ? tribe : [tribe];
				tribes.forEach((name) => add(String(name), value, 1));
			});
		});
	}),
);

const countryChart = computed<GroupedChart>(() =>
	buildGroupedChart((properties, featureEntries, add) => {
		const country = properties.country;
		if (country == null || country === "") return;
		Object.entries(featureEntries).forEach(([value, entries]) => {
			if (entries.length > 0) add(String(country), value, entries.length);
		});
	}),
);
</script>

<template>
	<div class="size-full overflow-auto p-3">
		<div class="mb-3 flex items-center justify-between gap-3">
			<h2 class="text-sm font-semibold">
				<template v-if="viewMode === 'tribe'"
					>Number of entries per tribe for "{{ featureLabel }}"</template
				>
				<template v-else-if="viewMode === 'country'"
					>Number of entries per country for "{{ featureLabel }}"</template
				>
				<template v-else>Number of entries per value of "{{ featureLabel }}"</template>
			</h2>
			<ToggleGroup
				:model-value="viewMode"
				type="single"
				variant="outline"
				@update:model-value="(value) => value && (viewMode = value as ViewMode)"
			>
				<ToggleGroupItem class="h-8" value="value">By value</ToggleGroupItem>
				<ToggleGroupItem class="h-8" value="tribe">By tribe</ToggleGroupItem>
				<ToggleGroupItem class="h-8" value="country">By country</ToggleGroupItem>
			</ToggleGroup>
		</div>

		<template v-if="viewMode === 'tribe'">
			<BarChart
				v-if="tribeChart.rows.length > 0"
				:categories="tribeChart.categories"
				:data="tribeChart.rows"
				index="key"
				orientation="horizontal"
			/>
			<p v-else class="text-sm text-on-muted">No tribe entries available for this feature.</p>
		</template>

		<template v-else-if="viewMode === 'country'">
			<BarChart
				v-if="countryChart.rows.length > 0"
				:categories="countryChart.categories"
				:data="countryChart.rows"
				index="key"
				orientation="horizontal"
			/>
			<p v-else class="text-sm text-on-muted">No country entries available for this feature.</p>
		</template>

		<template v-else>
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
		</template>
	</div>
</template>
