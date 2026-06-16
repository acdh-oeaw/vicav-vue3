<script setup lang="ts">
import { Axis, StackedBar } from "@unovis/ts";
import { VisAxis, VisBulletLegend, VisStackedBar, VisTooltip, VisXYContainer } from "@unovis/vue";
import { twMerge } from "tailwind-merge";
import { computed, type HTMLAttributes } from "vue";

type Datum = Record<string, unknown>;

interface Props {
	/** The records to display. Each record holds the index label and one or more numeric categories. */
	data: Array<Datum>;
	/** Key of the property used as the label for each bar (the categorical axis). */
	index: string;
	/** Keys of the numeric properties to render as bars. */
	categories: Array<string>;
	/** Layout of the bars. Horizontal grows in height with the number of bars. */
	orientation?: "horizontal" | "vertical";
	/** CSS color used to fill the bars when there is a single category. Defaults to the primary theme color. */
	color?: string;
	/** CSS colors per category, matched to `categories` by index. Falls back to the unovis palette. */
	colors?: Array<string>;
	/** Format a category key before it is shown in the legend and tooltip. */
	categoryFormatter?: (category: string) => string;
	/** Whether to render the category legend. Default: `true`. */
	showLegend?: boolean;
	/**
	 * Total height of the chart in pixels. When omitted the height is derived from the
	 * data so that horizontal charts always have enough room for every bar and label.
	 */
	height?: number;
	/** Space reserved per bar (incl. padding) when the height is computed automatically. */
	barThickness?: number;
	/** Format a value before it is shown on the value axis or in the tooltip. */
	valueFormatter?: (value: number) => string;
	/** Format an index label before it is shown on the category axis or in the tooltip. */
	labelFormatter?: (label: string) => string;
	/** Predicate marking data points whose category-axis label should be rendered bold. */
	emphasize?: (d: Datum) => boolean;
	class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
	orientation: "vertical",
	color: "hsl(var(--color-primary))",
	colors: undefined,
	barThickness: 8,
	valueFormatter: (value: number) => String(value),
	labelFormatter: (label: string) => label,
	categoryFormatter: (category: string) => category,
	showLegend: true,
});

const isHorizontal = computed(() => props.orientation === "horizontal");

/** Number of distinct colors in the unovis default categorical palette (--vis-color0..5). */
const PALETTE_SIZE = 6;

/** A color per category, shared between the bar segments and the legend so they always match. */
const categoryColors = computed(() =>
	props.categories.map(
		(_category, i) =>
			props.colors?.[i] ??
			(props.categories.length === 1 ? props.color : `var(--vis-color${i % PALETTE_SIZE})`),
	),
);

const legendItems = computed(() =>
	props.categories.map((category, i) => ({
		name: props.categoryFormatter(category),
		color: categoryColors.value[i],
	})),
);

/**
 * unovis renders horizontal bars bottom-up (the first datum sits at the bottom).
 * Reverse the data for horizontal charts so the first datum is drawn at the top,
 * matching normal reading order (and showing the biggest values first when sorted).
 */
const orderedData = computed(() =>
	isHorizontal.value ? props.data.slice().reverse() : props.data,
);

const x = (_d: Datum, i: number) => i;
const y = computed(() =>
	props.categories.map((category) => (d: Datum) => Number(d[category] ?? 0)),
);

function labelAtIndex(i: number) {
	const datum = orderedData.value[i];
	return datum ? props.labelFormatter(String(datum[props.index] ?? "")) : "";
}

const tickValues = computed(() => orderedData.value.map((_d, i) => i));

/** The data/category axis carries the labels, the value axis carries the numbers. */
const categoryAxisType = computed(() => (isHorizontal.value ? "y" : "x"));
const valueAxisType = computed(() => (isHorizontal.value ? "x" : "y"));

/** Approximate pixel width of the longest label, used to reserve room and size the wrap width. */
const longestLabelWidth = computed(() => {
	const longest = props.data.reduce(
		(maxLength, datum) =>
			Math.max(maxLength, props.labelFormatter(String(datum[props.index] ?? "")).length),
		0,
	);
	return Math.min(longest * 6.5 + 12, 240);
});

/** Reserve horizontal room for the longest label so it is not clipped. */
const labelMargin = computed(() => longestLabelWidth.value);

/**
 * Wrap width for the category-axis tick labels. unovis otherwise falls back to a
 * fraction of the container width and wraps long labels onto multiple tspans
 * (causing the overlapping lines). Sizing it to the reserved label space keeps
 * each label on a single line. Only meaningful on the horizontal (Y) label axis.
 */
const categoryTickTextWidth = computed(() =>
	isHorizontal.value ? Math.max(longestLabelWidth.value - 8, 24) : undefined,
);

const margin = computed(() =>
	isHorizontal.value
		? { top: 8, right: 16, bottom: 28, left: Math.max(labelMargin.value, 24) }
		: { top: 8, right: 8, bottom: 28, left: 40 },
);

/** Grow with the number of bars so labels and bars never overlap. */
const resolvedHeight = computed(() => {
	if (props.height != null) return props.height;
	if (isHorizontal.value) {
		const plotHeight = Math.max(props.data.length, 1) * (props.barThickness + 12);
		return plotHeight + margin.value.top + margin.value.bottom;
	}
	return 300;
});

const triggers = {
	[StackedBar.selectors.bar]: (segment: { datum: Datum }) => {
		const d = segment.datum;
		const label = props.labelFormatter(String(d[props.index] ?? ""));
		const rows = props.categories
			.map(
				(category) =>
					`<div class="flex items-center justify-between gap-4">
						<span class="text-on-muted">${props.categoryFormatter(category)}</span>
						<span class="font-medium">${props.valueFormatter(Number(d[category] ?? 0))}</span>
					</div>`,
			)
			.join("");
		return `<div class="text-xs">
			<div class="font-medium">${label}</div>
			${rows}
		</div>`;
	},
};

/**
 * unovis applies a single global font weight to all axis tick labels. To bold
 * only the emphasised ones we use unovis' `attributes` config, which sets a DOM
 * attribute on each tick label, passing the tick value (the datum index) to the
 * accessor. A presentation attribute on the label text overrides the weight it
 * would otherwise inherit from the tick group.
 */
const emphasizedIndices = computed(
	() => new Set(orderedData.value.flatMap((d, i) => (props.emphasize?.(d) ? [i] : []))),
);

const categoryAxisAttributes = computed(() =>
	props.emphasize
		? {
				[Axis.selectors.tickLabel]: {
					"font-weight": (i: number) => (emphasizedIndices.value.has(i) ? "700" : ""),
				},
				// Mark emphasised tick groups so their (bar-less) tick line can be hidden via CSS.
				[Axis.selectors.tick]: {
					"data-emphasized": (i: number) => (emphasizedIndices.value.has(i) ? "true" : "false"),
				},
			}
		: undefined,
);
</script>

<template>
	<div :class="twMerge('w-full', props.class)">
		<VisXYContainer :data="orderedData" :height="resolvedHeight" :margin="margin">
			<VisStackedBar
				:bar-padding="0.14"
				:bar-width="barThickness"
				:color="categoryColors"
				:orientation="orientation"
				:rounded-corners="4"
				:x="x"
				:y="y"
			/>
			<VisAxis
				:attributes="categoryAxisAttributes"
				:grid-line="false"
				:tick-format="labelAtIndex"
				:tick-text-width="categoryTickTextWidth"
				:tick-values="tickValues"
				:type="categoryAxisType"
			/>
			<VisAxis
				:position="props.orientation === 'horizontal' ? 'top' : 'left'"
				:tick-format="valueFormatter"
				:type="valueAxisType"
			/>
			<VisTooltip :triggers="triggers" />
		</VisXYContainer>

		<VisBulletLegend v-if="showLegend" class="mx-auto mb-2 w-fit" :items="legendItems" />
	</div>
</template>

<style scoped>
/* Emphasised labels (e.g. taxonomy headings) carry no bar, so drop their tick mark. */
:deep(.tick[data-emphasized="true"] line) {
	display: none;
}
</style>
