// @vitest-environment nuxt
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMarkerStore } from "./use-marker-store.ts";

const COLUMN = "feature1";
const OTHER_COLUMN = "feature2";

function member(value: string, columnId = COLUMN) {
	return { columnId, value };
}

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
		const group = store.createFeatureValueGroup([member("alpha"), member("beta")]);

		expect(group).toBeDefined();
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(group!.id);
		expect(store.resolveMarkerId(COLUMN, "beta")).toBe(group!.id);
		expect(store.resolveMarkerId(COLUMN, "gamma")).toBe(store.buildFeatureValueId(COLUMN, "gamma"));
		expect(store.isFeatureValueGroup(group!.id)).toBe(true);
	});

	it("registers a marker for the group so it can be styled and hidden", () => {
		const store = setupStore();
		const group = store.createFeatureValueGroup([member("alpha"), member("beta")])!;

		expect(store.markers.has(group.id)).toBe(true);
		// the group inherits the appearance of the value it was dropped onto
		expect(store.markers.get(group.id)?.colorCode).toBe(
			store.markers.get(store.buildFeatureValueId(COLUMN, "alpha"))?.colorCode,
		);
	});

	it("flags a repaint for every change that alters the drawn petals", () => {
		const store = setupStore();

		const group = store.createFeatureValueGroup([member("alpha"), member("beta")])!;
		expect(store.markerSettings.triggerRepaint).toBe(true);

		store.markerSettings.triggerRepaint = false;
		store.addValueToFeatureValueGroup(group.id, member("gamma"));
		expect(store.markerSettings.triggerRepaint).toBe(true);

		store.markerSettings.triggerRepaint = false;
		store.removeValueFromFeatureValueGroup(group.id, member("gamma"));
		expect(store.markerSettings.triggerRepaint).toBe(true);

		store.markerSettings.triggerRepaint = false;
		store.dissolveFeatureValueGroup(group.id);
		expect(store.markerSettings.triggerRepaint).toBe(true);
	});

	it("moves a value when it is dropped from one group into another", () => {
		const store = setupStore();
		store.addDefaultMarker(COLUMN, "delta");
		store.addDefaultMarker(COLUMN, "epsilon");
		const first = store.createFeatureValueGroup([
			member("alpha"),
			member("beta"),
			member("epsilon"),
		])!;
		const second = store.createFeatureValueGroup([member("gamma"), member("delta")])!;

		store.addValueToFeatureValueGroup(second.id, member("alpha"));

		expect(store.featureValueGroups.get(first.id)?.values).toEqual([
			member("beta"),
			member("epsilon"),
		]);
		expect(store.featureValueGroups.get(second.id)?.values).toContainEqual(member("alpha"));
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(second.id);
	});

	it("dissolves the source group when moving away its second to last value", () => {
		const store = setupStore();
		store.addDefaultMarker(COLUMN, "delta");
		const first = store.createFeatureValueGroup([member("alpha"), member("beta")])!;
		const second = store.createFeatureValueGroup([member("gamma"), member("delta")])!;

		store.addValueToFeatureValueGroup(second.id, member("alpha"));

		expect(store.featureValueGroups.has(first.id)).toBe(false);
		expect(store.resolveMarkerId(COLUMN, "beta")).toBe(store.buildFeatureValueId(COLUMN, "beta"));
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(second.id);
	});

	it("refuses to create a group from a single value", () => {
		const store = setupStore();
		// the legend renders every lone value as its own drop target, so a group of one
		// would be an invisible duplicate of it
		expect(store.createFeatureValueGroup([member("alpha")])).toBeUndefined();
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));
	});

	it("dissolves a group that would be left with a single value", () => {
		const store = setupStore();
		const group = store.createFeatureValueGroup([member("alpha"), member("beta")])!;

		store.removeValueFromFeatureValueGroup(group.id, member("beta"));

		expect(store.featureValueGroups.has(group.id)).toBe(false);
		expect(store.markers.has(group.id)).toBe(false);
		// values fall back to their own markers, which were never removed
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));
		expect(store.markers.has(store.buildFeatureValueId(COLUMN, "alpha"))).toBe(true);
	});

	it("keeps its members when the filter selection changes underneath it", () => {
		const store = setupStore();
		const group = store.createFeatureValueGroup([
			member("alpha"),
			member("beta"),
			member("gamma"),
		])!;

		// editing the query string re-emits the column filters, at times with nothing
		// selected at all - the grouping the user made has to outlive that
		expect(store.featureValueGroups.get(group.id)?.values).toEqual([
			member("alpha"),
			member("beta"),
			member("gamma"),
		]);
		expect(store.resolveMarkerId(COLUMN, "gamma")).toBe(group.id);
		expect(store.markers.has(group.id)).toBe(true);
	});

	it("round trips its groups through the url representation", () => {
		const store = setupStore();
		store.addDefaultMarker(COLUMN, "delta");
		store.createFeatureValueGroup([member("alpha"), member("beta")], "Bedouin dialects");
		store.createFeatureValueGroup([member("gamma"), member("delta")]);

		const serialized = store.serializeFeatureValueGroups();
		expect(serialized).toEqual([
			{ label: "Bedouin dialects", values: [member("alpha"), member("beta")] },
			{ label: "Group 2", values: [member("gamma"), member("delta")] },
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
		const stale = store.createFeatureValueGroup([member("alpha"), member("beta")])!;

		store.restoreFeatureValueGroups([
			{ label: "From the url", values: [member("beta"), member("gamma")] },
		]);

		expect(store.featureValueGroups.has(stale.id)).toBe(false);
		expect(store.markers.has(stale.id)).toBe(false);
		expect(store.serializeFeatureValueGroups()).toEqual([
			{ label: "From the url", values: [member("beta"), member("gamma")] },
		]);
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));
	});

	it("survives a group being dissolved before its debounced color update lands", () => {
		vi.useFakeTimers();
		try {
			const store = setupStore();
			const group = store.createFeatureValueGroup([member("alpha"), member("beta")])!;

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

describe("useMarkerStore groups across features", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	function setupTwoFeatures() {
		const store = setupStore();
		store.addDefaultMarker(OTHER_COLUMN);
		store.addDefaultMarker(OTHER_COLUMN, "alpha");
		store.addDefaultMarker(OTHER_COLUMN, "delta");
		store.markerSettings.triggerRepaint = false;
		return store;
	}

	it("draws values of different features with the same marker", () => {
		const store = setupTwoFeatures();
		const group = store.createFeatureValueGroup([member("beta"), member("delta", OTHER_COLUMN)])!;

		expect(store.resolveMarkerId(COLUMN, "beta")).toBe(group.id);
		expect(store.resolveMarkerId(OTHER_COLUMN, "delta")).toBe(group.id);
		// the untouched values of both features keep their own markers
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));
		expect(store.resolveMarkerId(OTHER_COLUMN, "alpha")).toBe(
			store.buildFeatureValueId(OTHER_COLUMN, "alpha"),
		);
	});

	it("tells apart the same value name in two features", () => {
		const store = setupTwoFeatures();
		// "alpha" exists in both features and only the one that was grouped may follow the group
		const group = store.createFeatureValueGroup([
			member("alpha", OTHER_COLUMN),
			member("delta", OTHER_COLUMN),
		])!;

		expect(store.resolveMarkerId(OTHER_COLUMN, "alpha")).toBe(group.id);
		expect(store.resolveMarkerId(COLUMN, "alpha")).toBe(store.buildFeatureValueId(COLUMN, "alpha"));

		store.removeValueFromFeatureValueGroup(group.id, member("alpha"));
		expect(store.resolveMarkerId(OTHER_COLUMN, "alpha")).toBe(group.id);
	});

	it("lists a group under every feature it reaches into", () => {
		const store = setupTwoFeatures();
		const group = store.createFeatureValueGroup([member("beta"), member("delta", OTHER_COLUMN)])!;

		expect(store.getFeatureValueGroups(COLUMN)).toEqual([group]);
		expect(store.getFeatureValueGroups(OTHER_COLUMN)).toEqual([group]);
	});

	it("leaves a group spanning features alone when a single feature is hidden", () => {
		const store = setupTwoFeatures();
		const group = store.createFeatureValueGroup([member("beta"), member("delta", OTHER_COLUMN)])!;
		const ownFeatureGroup = store.createFeatureValueGroup([member("alpha"), member("gamma")])!;

		// hiding a feature hides everything drawn for it, but the shared group belongs to
		// neither feature alone and stays visible until it is hidden itself
		store.setMarker({ ...store.markers.get(COLUMN)!, hidden: true });

		expect(store.markers.get(group.id)?.hidden).toBe(false);
		expect(store.markers.get(ownFeatureGroup.id)?.hidden).toBe(true);
	});

	it("round trips a group spanning features through the url representation", () => {
		const store = setupTwoFeatures();
		store.createFeatureValueGroup([member("beta"), member("delta", OTHER_COLUMN)], "Shared");

		const serialized = store.serializeFeatureValueGroups();
		expect(serialized).toEqual([
			{ label: "Shared", values: [member("beta"), member("delta", OTHER_COLUMN)] },
		]);

		setActivePinia(createPinia());
		const restored = setupTwoFeatures();
		restored.restoreFeatureValueGroups(serialized);

		expect(restored.serializeFeatureValueGroups()).toEqual(serialized);
		expect(restored.resolveMarkerId(COLUMN, "beta")).toBe(
			restored.resolveMarkerId(OTHER_COLUMN, "delta"),
		);
	});
});
