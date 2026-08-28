// @vitest-environment nuxt
import { latLng } from "leaflet";
import { describe, expect, it } from "vitest";
import { nextTick, watch } from "vue";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import { useMarkerStore } from "@/stores/use-marker-store.ts";
import { FilterValueMap } from "@/utils/filter-value-map.ts";

import { usePetalMarker } from "./use-petal-marker.ts";

const COLUMN = "feature1";

function stubTable(values: Array<string>) {
	let filterValue = new FilterValueMap(values.map((value) => [value, 1]));
	const column = {
		id: COLUMN,
		getCanFilter: () => true,
		getCanHide: () => true,
		getIsFiltered: () => true,
		getFilterValue: () => filterValue,
	};
	return {
		getVisibleLeafColumns: () => [column],
		// stands in for the user editing the query string
		setFilter: (next: Array<string>) => {
			filterValue = new FilterValueMap(next.map((value) => [value, 1]));
		},
	};
}

function renderMarker(properties: Record<string, unknown>) {
	const { getPetalMarker } = usePetalMarker();
	const feature = {
		type: "Feature" as const,
		geometry: { type: "Point" as const, coordinates: [0, 0] },
		properties,
	};
	const leafletMarker = getPetalMarker(
		feature as unknown as Parameters<typeof getPetalMarker>[0],
		latLng(0, 0),
	);
	return (leafletMarker.options.icon as { options: { html: string } }).options.html;
}

function petalIds(html: string) {
	return [...html.matchAll(/title="([^"]+)"/g)].map((match) => match[1]);
}

describe("petal markers reflect custom feature value groups", () => {
	it("collapses grouped values into a single petal and repaints the map", async () => {
		const geojsonStore = useGeojsonStore();
		const markerStore = useMarkerStore();
		geojsonStore.table = stubTable(["alpha", "beta"]) as unknown as typeof geojsonStore.table;

		markerStore.addDefaultMarker(COLUMN);
		markerStore.addDefaultMarker(COLUMN, "alpha");
		markerStore.addDefaultMarker(COLUMN, "beta");
		markerStore.markerSettings.triggerRepaint = false;
		await nextTick();

		// mirrors the repaint watcher in geo-map.client.vue
		let repaints = 0;
		watch(
			() => markerStore.markerSettings.triggerRepaint,
			() => {
				if (markerStore.markerSettings.triggerRepaint) {
					repaints += 1;
					markerStore.markerSettings.triggerRepaint = false;
				}
			},
		);
		await nextTick();

		const properties = { [COLUMN]: { alpha: [{}], beta: [{}] } };
		expect(petalIds(renderMarker(properties))).toEqual([
			`${COLUMN}-alpha`,
			`${COLUMN}-beta`,
			COLUMN,
		]);

		const group = markerStore.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;
		await nextTick();

		// the change has to reach the map, and the map has to draw one petal for the group
		expect(repaints).toBe(1);
		expect(petalIds(renderMarker(properties))).toEqual([group.id, COLUMN]);

		// a place holding only one of the grouped values still gets the group petal
		expect(petalIds(renderMarker({ [COLUMN]: { beta: [{}] } }))).toEqual([group.id, COLUMN]);

		markerStore.dissolveFeatureValueGroup(group.id);
		await nextTick();

		expect(repaints).toBe(2);
		expect(petalIds(renderMarker(properties))).toEqual([
			`${COLUMN}-alpha`,
			`${COLUMN}-beta`,
			COLUMN,
		]);
	});

	it("survives the filter selection changing under it", () => {
		const geojsonStore = useGeojsonStore();
		const markerStore = useMarkerStore();
		const table = stubTable(["alpha", "beta"]);
		geojsonStore.table = table as unknown as typeof geojsonStore.table;

		markerStore.addDefaultMarker(COLUMN);
		markerStore.addDefaultMarker(COLUMN, "alpha");
		markerStore.addDefaultMarker(COLUMN, "beta");

		const group = markerStore.createFeatureValueGroup(COLUMN, ["alpha", "beta"])!;
		const properties = { [COLUMN]: { alpha: [{}], beta: [{}] } };
		expect(petalIds(renderMarker(properties))).toEqual([group.id, COLUMN]);

		// editing the query string clears the filters before re-applying them
		table.setFilter([]);
		expect(markerStore.featureValueGroups.has(group.id)).toBe(true);

		table.setFilter(["alpha"]);
		expect(petalIds(renderMarker(properties))).toEqual([group.id, COLUMN]);

		// the value that dropped out rejoins the group once it is selected again
		table.setFilter(["alpha", "beta"]);
		expect(petalIds(renderMarker(properties))).toEqual([group.id, COLUMN]);
		expect(markerStore.featureValueGroups.get(group.id)?.values).toEqual(["alpha", "beta"]);
	});
});
