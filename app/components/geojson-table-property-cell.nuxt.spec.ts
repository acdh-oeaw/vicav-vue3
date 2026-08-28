// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { Column } from "@tanstack/vue-table";
import { beforeEach, describe, expect, it } from "vitest";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import { useMarkerStore } from "@/stores/use-marker-store.ts";

import GeojsonTablePropertyCell from "./geojson-table-property-cell.vue";

const COLUMN = "feature1";

/** Two values sharing a tribe, one value on its own. */
const value = {
	alpha: [{ tribe: ["Tribe A"] }],
	beta: [{ tribe: ["Tribe A"] }],
	gamma: [{ tribe: ["Tribe B"] }],
};

function mountCell() {
	return mountSuspended(GeojsonTablePropertyCell, {
		props: {
			value,
			highlightedValues: ["alpha", "beta", "gamma"],
			column: {
				id: COLUMN,
				columnDef: { id: COLUMN, header: "Feature 1" },
			} as unknown as Column<PatchedFeatureType>,
			fullEntry: { name: "Somewhere" } as unknown as PatchedFeatureType["properties"],
		},
	});
}

function setupMarkers() {
	const store = useMarkerStore();
	store.addDefaultMarker(COLUMN);
	store.addDefaultMarker(COLUMN, "alpha");
	store.addDefaultMarker(COLUMN, "beta");
	store.addDefaultMarker(COLUMN, "gamma");
	return store;
}

/** Text of each rendered line, ignoring the screen reader only labels. */
function rowLabels(wrapper: Awaited<ReturnType<typeof mountCell>>) {
	return wrapper.findAll("button").map((button) => button.text());
}

describe("geojson table property cell", () => {
	// the component resolves its stores from the Nuxt app, so the test has to share that
	// instance rather than activate one of its own - reset the shared state instead
	beforeEach(() => {
		const markerStore = useMarkerStore();
		markerStore.featureValueGroups.clear();
		markerStore.markers.clear();
	});

	it("keeps one line per value while nothing is grouped", async () => {
		setupMarkers();
		useGeojsonStore().showAllDetails = false;

		const wrapper = await mountCell();

		expect(rowLabels(wrapper)).toEqual(
			expect.arrayContaining([
				expect.stringContaining("alpha"),
				expect.stringContaining("beta"),
				expect.stringContaining("gamma"),
			]),
		);
	});

	it("collapses a group into a single line with the tribe badge shown once", async () => {
		const markerStore = setupMarkers();
		useGeojsonStore().showAllDetails = false;
		markerStore.createFeatureValueGroup(COLUMN, ["alpha", "beta"], "Group 1");

		const wrapper = await mountCell();
		const labels = rowLabels(wrapper);
		const text = wrapper.text();

		// the two grouped values share one line, the lone value keeps its own
		expect(labels.filter((label) => label.includes("Group 1"))).toHaveLength(1);
		expect(labels.some((label) => label.includes("alpha"))).toBe(false);
		expect(labels.some((label) => label.includes("beta"))).toBe(false);
		expect(labels.some((label) => label.includes("gamma"))).toBe(true);

		// "Tribe A" is on both grouped values but must not be repeated
		expect(text.split("Tribe A").length - 1).toBe(1);
		expect(text).toContain("Tribe B");
	});

	it("picks up a renamed group on the collapsed line", async () => {
		const markerStore = setupMarkers();
		useGeojsonStore().showAllDetails = false;
		const group = markerStore.createFeatureValueGroup(COLUMN, ["alpha", "beta"], "Group 1")!;

		const wrapper = await mountCell();
		markerStore.renameFeatureValueGroup(group.id, "Bedouin dialects");
		await nextTick();

		const labels = rowLabels(wrapper);
		expect(labels.filter((label) => label.includes("Bedouin dialects"))).toHaveLength(1);
		expect(labels.some((label) => label.includes("Group 1"))).toBe(false);
	});

	it("picks up a renamed group on the expanded badges", async () => {
		const markerStore = setupMarkers();
		useGeojsonStore().showAllDetails = true;
		const group = markerStore.createFeatureValueGroup(COLUMN, ["alpha", "beta"], "Group 1")!;

		const wrapper = await mountCell();
		markerStore.renameFeatureValueGroup(group.id, "Bedouin dialects");
		await nextTick();

		const text = wrapper.text();
		expect(text.split("Bedouin dialects").length - 1).toBe(2);
		expect(text).not.toContain("Group 1");
	});

	it("expands a group into its values, each badged with the group", async () => {
		const markerStore = setupMarkers();
		useGeojsonStore().showAllDetails = true;
		markerStore.createFeatureValueGroup(COLUMN, ["alpha", "beta"], "Group 1");

		const wrapper = await mountCell();
		const labels = rowLabels(wrapper);
		const text = wrapper.text();

		expect(labels.some((label) => label.includes("alpha"))).toBe(true);
		expect(labels.some((label) => label.includes("beta"))).toBe(true);
		expect(labels.some((label) => label.includes("gamma"))).toBe(true);
		// one group badge per grouped value, none for the ungrouped one
		expect(text.split("Group 1").length - 1).toBe(2);
	});
});
