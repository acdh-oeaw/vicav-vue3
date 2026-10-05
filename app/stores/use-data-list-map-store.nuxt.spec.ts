// @vitest-environment nuxt
import { mockComponent, mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { createPinia, getActivePinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, effectScope, h, nextTick } from "vue";

import GeoMapWindowContent from "@/components/geo-map-window-content.vue";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";

import { useDataListMapStore } from "./use-data-list-map-store.ts";
import { useTeiHeadersStore } from "./use-tei-headers-store.ts";

mockNuxtImport("useProjectInfo", () => () => ({
	data: { value: undefined },
	suspense: () => Promise.resolve(),
}));
mockNuxtImport("useMarkerClickHandler", () => () => vi.fn());
mockNuxtImport("useGeoMarkerLayers", () => () => ({ value: [] }));
mockComponent("GeoMap", () => ({ name: "GeoMap", props: ["markers"], template: "<div />" }));
mockComponent("VisualisationContainer", () => ({
	template: '<div><slot :width="800" :height="600" /></div>',
}));

function entity(id: string, label: string): simpleTEIMetadata {
	return {
		id,
		label,
		title: label,
		dataType: "SampleText",
		place: { settlement: "Urfa" },
		coordinates: [38.8, 37.2],
		geoSource: "samples",
		person: [],
		category: "",
		resp: "",
		pubDate: "",
		audioAvailability: "free",
		"@hasTEIw": "true",
		author: [],
		recording: [],
		principal: [],
		transcription: [],
		"transfer to ELAN": [],
		publication: { refType: "internal", type: "", bibl: { author: [], title: "", issued: [] } },
	};
}

describe("retained data list datasets", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		useTeiHeadersStore().simpleItems = [entity("1", "Alpha"), entity("2", "Beta")];
	});

	it("retains the filtered table after its list scope closes and reuses it on reopening", async () => {
		const store = useDataListMapStore();
		const listScope = effectScope();
		const params = {
			dataTypes: ["SampleText"] as const,
			mapEnabled: true,
			listState: { globalFilter: "Alpha" },
		};
		const dataset = listScope.run(() =>
			store.ensureDataset("samples", "Samples", {
				...params,
				dataTypes: [...params.dataTypes],
			}),
		)!;
		const model = dataset.model!;
		await nextTick();
		expect(store.layers.samples?.markers.map((marker) => marker.id)).toEqual(["1"]);
		listScope.stop();
		expect(store.layers.samples?.markers.map((marker) => marker.id)).toEqual(["1"]);

		model.globalFilter.value = "Beta";
		await nextTick();
		expect(store.layers.samples?.markers.map((marker) => marker.id)).toEqual(["2"]);
		const reopened = store.ensureDataset("samples", "Samples", {
			dataTypes: ["SampleText"],
			mapEnabled: false,
		});
		expect(reopened.model?.table).toBe(model.table);
		expect(reopened.model?.globalFilter.value).toBe("Beta");
		expect(reopened.enabled.value).toBe(true);
	});

	it("hides and restores a retained layer without an open list", async () => {
		const store = useDataListMapStore();
		store.ensureDataset("samples", "Samples", { dataTypes: ["SampleText"], mapEnabled: true });
		store.toggleLayer("samples");
		expect(store.layers.samples?.enabled).toBe(false);
		expect(store.layers.samples?.markers).toHaveLength(2);
		store.toggleLayer("samples");
		expect(store.layers.samples?.enabled).toBe(true);

		useTeiHeadersStore().simpleItems = [entity("3", "Gamma")];
		await nextTick();
		expect(store.layers.samples?.markers.map((marker) => marker.id)).toEqual(["3"]);
		store.removeDataset("samples");
		expect(store.datasets.has("samples")).toBe(false);
		expect(store.layers.samples).toBeUndefined();
	});

	it("retains mixed list selections without requiring a TanStack table", () => {
		const store = useDataListMapStore();
		const dataset = store.ensureDataset("mixed", "Mixed", {
			dataTypes: ["SampleText", "Profile"],
			mapEnabled: true,
			filterListBy: { key: "label", value: "Alpha" },
		});
		expect(dataset.model).toBeUndefined();
		expect(store.layers.mixed?.markers.map((marker) => marker.id)).toEqual(["1"]);
	});

	it("toggles markers from the toolbar after the list closes without resetting hidden entries", async () => {
		const store = useDataListMapStore();
		const listScope = effectScope();
		listScope.run(() =>
			store.ensureDataset("samples", "Samples", {
				dataTypes: ["SampleText"],
				mapEnabled: true,
			}),
		);
		listScope.stop();
		const map = defineComponent({
			setup: () => () =>
				h(GeoMapWindowContent, {
					params: {
						endpoint: "data_markers",
						queryString: "",
						dataListLayers: Object.values(store.layers),
					},
				}),
		});
		const wrapper = await mountSuspended(map, { global: { plugins: [getActivePinia()!] } });
		expect(wrapper.get("button").attributes("aria-pressed")).toBe("true");
		await wrapper.get("button").trigger("click");
		expect(store.layers.samples?.enabled).toBe(false);
		expect(wrapper.get("button").attributes("aria-pressed")).toBe("false");
		expect(wrapper.findComponent({ name: "GeoMap" }).exists()).toBe(false);

		useTeiHeadersStore().simpleItems = [entity("3", "Gamma")];
		await nextTick();
		expect(wrapper.get("button").attributes("aria-pressed")).toBe("false");
		await wrapper.get("button").trigger("click");
		expect(wrapper.get("button").attributes("aria-pressed")).toBe("true");
		expect(wrapper.findComponent({ name: "GeoMap" }).exists()).toBe(true);
		expect(store.layers.samples?.markers.map((marker) => marker.id)).toEqual(["3"]);
		wrapper.unmount();
	});
});
