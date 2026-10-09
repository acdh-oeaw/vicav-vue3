// @vitest-environment nuxt
import { mockComponent, mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import type { Feature, Point } from "geojson";
import { describe, expect, it, vi } from "vitest";

import type { MarkerProperties } from "@/components/geo-map.context.ts";
import type { DataListMapLayer } from "@/types/global.ts";

import GeoMapPopupContent from "./geo-map-popup-content.vue";
import GeoMapWindowContent from "./geo-map-window-content.vue";

type DataListMarkerFeature = Feature<
	Point,
	MarkerProperties & {
		dataListMapMarkers: Array<Feature<Point, MarkerProperties>>;
		dataListMapColors: Array<string>;
	}
>;

mockNuxtImport("useProjectInfo", () => () => ({ data: { value: undefined } }));
mockNuxtImport("useWindowsStore", () => () => ({ registry: new Map() }));
mockNuxtImport("useMarkerClickHandler", () => () => vi.fn());
mockNuxtImport("useGeoMarkerLayers", () => () => ({ value: [] }));

mockComponent("GeoMap", () => ({ name: "GeoMap", props: ["markers"], template: "<div />" }));
mockComponent("GeoMapToolbar", () => ({ template: "<div />" }));
mockComponent("VisualisationContainer", () => ({
	template: '<slot :width="800" :height="600" />',
}));

function makeLayer(id: string, entityIds: Array<string>): DataListMapLayer {
	return {
		id,
		title: "Sample texts",
		color: "#b91c1c",
		markers: entityIds.map((entityId) => ({
			id: entityId,
			label: `Sample ${entityId}`,
			placeName: "Urfa",
			dataType: "SampleText",
			coordinates: [38.8, 37.2],
		})),
	};
}

describe("data list map place labels", () => {
	it.each([1, 3])("shows the place name and count for %i linked entities", async (count) => {
		const layer = makeLayer(
			"samples",
			Array.from({ length: count }, (_, index) => String(index)),
		);
		const wrapper = await mountSuspended(GeoMapWindowContent, {
			props: {
				params: { endpoint: "data_markers", queryString: "", dataListLayers: [layer] },
			},
		});
		const marker = (
			wrapper.findComponent({ name: "GeoMap" }).props("markers") as Array<DataListMarkerFeature>
		)[0]!;
		expect(marker.properties.name).toBe("Urfa");
		expect(marker.properties.hitCount).toBe(count);
		expect(marker.properties.dataListMapMarkers).toHaveLength(count);

		const popup = await mountSuspended(GeoMapPopupContent, {
			props: { markers: marker.properties.dataListMapMarkers, groupMarkers: true },
		});
		expect(popup.get("h2").text()).toBe(`Urfa (${String(count)})`);
		expect(popup.findAll("a").map((link) => link.text())).toEqual(
			layer.markers.map((entity) => entity.label),
		);
		popup.unmount();
		wrapper.unmount();
	});

	it("counts an entity only once when it appears in multiple list layers", async () => {
		const wrapper = await mountSuspended(GeoMapWindowContent, {
			props: {
				params: {
					endpoint: "data_markers",
					queryString: "",
					dataListLayers: [makeLayer("first", ["1", "2"]), makeLayer("second", ["2", "3"])],
				},
			},
		});
		const marker = (
			wrapper.findComponent({ name: "GeoMap" }).props("markers") as Array<DataListMarkerFeature>
		)[0]!;
		expect(marker.properties.hitCount).toBe(3);
		expect(marker.properties.dataListMapMarkers).toHaveLength(3);
		expect(marker.properties.dataListMapColors).toHaveLength(4);
		wrapper.unmount();
	});
});
