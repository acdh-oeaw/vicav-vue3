// @vitest-environment nuxt
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMarkerStore } from "./use-marker-store.ts";

const COLUMN = "feature1";

function setupStore() {
	const store = useMarkerStore();
	store.addDefaultMarker(COLUMN);
	store.addDefaultMarker(COLUMN, "alpha");
	store.addDefaultMarker(COLUMN, "beta");
	store.addDefaultMarker(COLUMN, "gamma");
	store.markerSettings.triggerRepaint = false;
	return store;
}

describe("useMarkerStore feature value groups", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it("resolves grouped values to the group marker and ungrouped ones to their own", () => {
		const store = setupStore();
		const group = store.createFeatureValueGroup(COLUMN, ["alpha", "beta"]);

		expect(group).toBeDefined();
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(group!.id);
		expect(store.resolveMarkerId(COLUMN, "beta")).toBe(group!.id);
		expect(store.resolveMarkerId(COLUMN, "gamma")).toBe(store.buildFeatureValueId(COLUMN, "gamma"));
		expect(store.isFeatureValueGroup(group!.id)).toBe(true);
	});

	it("registers a marker for the group so it can be styled and hidden", () => {
		const store = setupStore();
		const group = store.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;

		expect(store.markers.has(group.id)).toBe(true);
		// the group inherits the appearance of the value it was dropped onto
		expect(store.markers.get(group.id)?.colorCode).toBe(
			store.markers.get(store.buildFeatureValueId(COLUMN, "alpha"))?.colorCode,
		);
	});

	it("flags a repaint for every change that alters the drawn petals", () => {
		const store = setupStore();

		const group = store.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;
		expect(store.markerSettings.triggerRepaint).toBe(true);

		store.markerSettings.triggerRepaint = false;
		store.addValueToFeatureValueGroup(group.id, "gamma");
		expect(store.markerSettings.triggerRepaint).toBe(true);

		store.markerSettings.triggerRepaint = false;
		store.removeValueFromFeatureValueGroup(group.id, "gamma");
		expect(store.markerSettings.triggerRepaint).toBe(true);

		store.markerSettings.triggerRepaint = false;
		store.dissolveFeatureValueGroup(group.id);
		expect(store.markerSettings.triggerRepaint).toBe(true);
	});

	it("moves a value when it is dropped from one group into another", () => {
		const store = setupStore();
		store.addDefaultMarker(COLUMN, "delta");
		store.addDefaultMarker(COLUMN, "epsilon");
		const first = store.createFeatureValueGroup(COLUMN, ["alpha", "beta", "epsilon"])!;
		const second = store.createFeatureValueGroup(COLUMN, ["gamma", "delta"])!;

		store.addValueToFeatureValueGroup(second.id, "alpha");

		expect(store.featureValueGroups.get(first.id)?.values).toEqual(["beta", "epsilon"]);
		expect(store.featureValueGroups.get(second.id)?.values).toContain("alpha");
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(second.id);
	});

	it("dissolves the source group when moving away its second to last value", () => {
		const store = setupStore();
		store.addDefaultMarker(COLUMN, "delta");
		const first = store.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;
		const second = store.createFeatureValueGroup(COLUMN, ["gamma", "delta"])!;

		store.addValueToFeatureValueGroup(second.id, "alpha");

		expect(store.featureValueGroups.has(first.id)).toBe(false);
		expect(store.resolveMarkerId(COLUMN, "beta")).toBe(store.buildFeatureValueId(COLUMN, "beta"));
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(second.id);
	});

	it("refuses to create a group from a single value", () => {
		const store = setupStore();
		// the legend renders every lone value as its own drop target, so a group of one
		// would be an invisible duplicate of it
		expect(store.createFeatureValueGroup(COLUMN, ["alpha"])).toBeUndefined();
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));
	});

	it("dissolves a group that would be left with a single value", () => {
		const store = setupStore();
		const group = store.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;

		store.removeValueFromFeatureValueGroup(group.id, "beta");

		expect(store.featureValueGroups.has(group.id)).toBe(false);
		expect(store.markers.has(group.id)).toBe(false);
		// values fall back to their own markers, which were never removed
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));
		expect(store.markers.has(store.buildFeatureValueId(COLUMN, "alpha"))).toBe(true);
	});

	it("keeps its members when the filter selection changes underneath it", () => {
		const store = setupStore();
		const group = store.createFeatureValueGroup(COLUMN, ["alpha", "beta", "gamma"])!;

		// editing the query string re-emits the column filters, at times with nothing
		// selected at all - the grouping the user made has to outlive that
		expect(store.featureValueGroups.get(group.id)?.values).toEqual(["alpha", "beta", "gamma"]);
		expect(store.resolveMarkerId(COLUMN, "gamma")).toBe(group.id);
		expect(store.markers.has(group.id)).toBe(true);
	});

	it("round trips its groups through the url representation", () => {
		const store = setupStore();
		store.addDefaultMarker(COLUMN, "delta");
		store.createFeatureValueGroup(COLUMN, ["alpha", "beta"], "Bedouin dialects");
		store.createFeatureValueGroup(COLUMN, ["gamma", "delta"]);

		const serialized = store.serializeFeatureValueGroups();
		expect(serialized).toEqual([
			{ columnId: COLUMN, label: "Bedouin dialects", values: ["alpha", "beta"] },
			{ columnId: COLUMN, label: "Group 2", values: ["gamma", "delta"] },
		]);

		// a fresh session opening the shared link
		setActivePinia(createPinia());
		const restored = setupStore();
		restored.addDefaultMarker(COLUMN, "delta");
		restored.restoreFeatureValueGroups(serialized);

		expect(restored.serializeFeatureValueGroups()).toEqual(serialized);
		expect(restored.resolveMarkerId(COLUMN, "alpha")).toBe(
			restored.resolveMarkerId(COLUMN, "beta"),
		);
		expect(restored.resolveMarkerId(COLUMN, "gamma")).toBe(
			restored.resolveMarkerId(COLUMN, "delta"),
		);
		expect(restored.resolveMarkerId(COLUMN, "alpha")).not.toBe(
			restored.resolveMarkerId(COLUMN, "gamma"),
		);
		// the group is drawable right away, with the appearance of its first member
		const groupId = restored.resolveMarkerId(COLUMN, "alpha");
		expect(restored.markers.get(groupId)?.colorCode).toBe(
			restored.markers.get(restored.buildFeatureValueId(COLUMN, "alpha"))?.colorCode,
		);
	});

	it("replaces the groups it had when a url is restored over them", () => {
		const store = setupStore();
		const stale = store.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;

		store.restoreFeatureValueGroups([
			{ columnId: COLUMN, label: "From the url", values: ["beta", "gamma"] },
		]);

		expect(store.featureValueGroups.has(stale.id)).toBe(false);
		expect(store.markers.has(stale.id)).toBe(false);
		expect(store.serializeFeatureValueGroups()).toEqual([
			{ columnId: COLUMN, label: "From the url", values: ["beta", "gamma"] },
		]);
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));
	});

	it("survives a group being dissolved before its debounced color update lands", () => {
		vi.useFakeTimers();
		try {
			const store = setupStore();
			const group = store.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;

			store.setColor({ id: group.id, colorCode: "#123456" });
			store.dissolveFeatureValueGroup(group.id);

			expect(() => {
				vi.advanceTimersByTime(1000);
			}).not.toThrow();
			expect(store.markers.has(group.id)).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});
});
