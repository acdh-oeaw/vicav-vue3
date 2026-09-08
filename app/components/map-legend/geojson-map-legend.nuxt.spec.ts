// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import { useMarkerStore } from "@/stores/use-marker-store.ts";
import { FilterValueMap } from "@/utils/filter-value-map.ts";

import GeojsonMapLegend from "./geojson-map-legend.vue";

const COLUMN = "feature1";
const OTHER_COLUMN = "feature2";

function member(value: string, columnId = COLUMN) {
	return { columnId, value };
}

/** A column whose selected values are `values`, over places holding `facets`. */
function stubColumn(id: string, header: string, values: Array<string>, facets: Array<string>) {
	return {
		id,
		columnDef: { id, header },
		getCanHide: () => true,
		getCanFilter: () => true,
		getIsFiltered: () => true,
		getFilterValue: () => new FilterValueMap(values.map((value) => [value, 1])),
		getFacetedUniqueValues: () => new Map(facets.map((facet) => [facet, 1])),
	};
}

/** Each row holds the values of one place, keyed by column. */
function stubTable(
	columns: Array<ReturnType<typeof stubColumn>>,
	rows: Array<Record<string, Array<string>>>,
) {
	return {
		getVisibleLeafColumns: () => columns,
		getFilteredRowModel: () => ({
			rows: rows.map((row) => ({ getValue: (columnId: string) => row[columnId] ?? [] })),
		}),
	};
}

function setupLegend() {
	const markerStore = useMarkerStore();
	[COLUMN, OTHER_COLUMN].forEach((columnId) => {
		markerStore.addDefaultMarker(columnId);
		["alpha", "beta", "delta"].forEach((value) => {
			markerStore.addDefaultMarker(columnId, value);
		});
	});

	useGeojsonStore().table = stubTable(
		[
			stubColumn(COLUMN, "Feature 1", ["alpha", "beta"], ["alpha", "beta"]),
			stubColumn(OTHER_COLUMN, "Feature 2", ["delta"], ["delta"]),
		],
		[
			{ [COLUMN]: ["alpha"], [OTHER_COLUMN]: [] },
			{ [COLUMN]: ["beta"], [OTHER_COLUMN]: ["delta"] },
			{ [COLUMN]: [], [OTHER_COLUMN]: ["delta"] },
		],
	) as unknown as ReturnType<typeof useGeojsonStore>["table"];

	return markerStore;
}

let wrapper: { unmount: () => void } | undefined;

async function mountLegend() {
	const mounted = await mountSuspended(GeojsonMapLegend, { props: { params: {} } });
	wrapper = mounted;
	return mounted;
}

/** Rendered text with the non breaking spaces the labels use turned into plain ones. */
function textOf(element: { text: () => string }) {
	return element.text().replaceAll(" ", " ");
}

/** The name of every group box currently drawn, in document order. */
function groupNames(mounted: Awaited<ReturnType<typeof mountLegend>>) {
	return mounted
		.findAll("[data-legend-group] input[aria-label='Group name']")
		.map((input) => (input.element as HTMLInputElement).value);
}

describe("geojson map legend", () => {
	// the component resolves its stores from the Nuxt app, so the test has to share that
	// instance rather than activate one of its own - reset the shared state instead
	beforeEach(() => {
		const markerStore = useMarkerStore();
		markerStore.featureValueGroups.clear();
		markerStore.markers.clear();
	});

	// a mounted legend keeps redrawing on the store it shares with the next test
	afterEach(() => {
		wrapper?.unmount();
		wrapper = undefined;
	});

	it("lists a group of one feature under that feature", async () => {
		const markerStore = setupLegend();
		markerStore.createFeatureValueGroup([member("alpha"), member("beta")], "Bedouin dialects");

		const mounted = await mountLegend();

		expect(groupNames(mounted)).toEqual(["Bedouin dialects"]);
		expect(mounted.find("[data-legend-cross-feature-groups]").exists()).toBe(false);
		// the box holds both values, and neither is left standing on its own next to it
		const box = mounted.find("[data-legend-group]");
		expect(textOf(box)).toContain("alpha");
		expect(textOf(box)).toContain("beta");
	});

	it("lists a group spanning features in its own section, naming each value's feature", async () => {
		const markerStore = setupLegend();
		markerStore.createFeatureValueGroup([member("beta"), member("delta", OTHER_COLUMN)], "Shared");

		const mounted = await mountLegend();
		const section = mounted.find("[data-legend-cross-feature-groups]");

		expect(groupNames(mounted)).toEqual(["Shared"]);
		expect(section.exists()).toBe(true);
		expect(textOf(section)).toContain("Groups across features");
		// the values come from different features, so the box says which is which
		expect(textOf(section)).toContain("Feature 1: beta");
		expect(textOf(section)).toContain("Feature 2: delta");
		// and neither feature lists it a second time
		expect(mounted.findAll("[data-legend-group]")).toHaveLength(1);
	});

	it("counts the places a group covers across all of its features", async () => {
		const markerStore = setupLegend();
		markerStore.createFeatureValueGroup([member("beta"), member("delta", OTHER_COLUMN)], "Shared");

		const mounted = await mountLegend();

		// the first place has neither value, the second has both and counts once, the third
		// only has "delta"
		expect(textOf(mounted.find("[data-legend-group]"))).toContain("(2)");
	});

	it("keeps a group out of the features it has no selected value in", async () => {
		const markerStore = setupLegend();
		// "gamma" is selected in neither feature, so only "beta" is left to show
		markerStore.createFeatureValueGroup([member("beta"), member("gamma", OTHER_COLUMN)], "Shared");

		const mounted = await mountLegend();

		expect(groupNames(mounted)).toEqual(["Shared"]);
		// with a single visible member it is a plain feature group again, not one spanning features
		expect(mounted.find("[data-legend-cross-feature-groups]").exists()).toBe(false);
		expect(textOf(mounted.find("[data-legend-group]"))).not.toContain("Feature 1: beta");
	});
});
