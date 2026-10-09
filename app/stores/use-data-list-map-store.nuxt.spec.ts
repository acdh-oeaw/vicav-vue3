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

function markMetadataReady(etag = "project-1") {
	useTeiHeadersStore().initialization = {
		ready: true,
		pipelineVersion: 2,
		projectIdentity: "https://example.test",
		etag,
	};
}

describe("configured dataset bootstrap and hydration", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		useTeiHeadersStore().simpleItems = [entity("1", "Alpha"), entity("2", "Beta")];
		markMetadataReady();
	});

	it("registers only available datasets, disabled, without attaching a list", async () => {
		const store = useDataListMapStore();
		await Promise.all([store.initialize(), store.initialize()]);
		expect(Object.keys(store.records)).toEqual(["configured:samples"]);
		expect(store.records["configured:samples"]).toMatchObject({
			attached: false,
			enabled: false,
			mapped: true,
		});
		expect(store.layers["configured:samples"]?.markers).toHaveLength(2);
		const model = store.datasets.get("configured:samples")!.model;
		await store.initialize();
		expect(store.datasets.get("configured:samples")!.model).toBe(model);
	});

	it.each([false, true])(
		"reuses serialized Pinia records without rediscovery (empty=%s)",
		async (empty) => {
			if (empty) useTeiHeadersStore().simpleItems = [];
			const original = useDataListMapStore();
			await original.initialize();
			if (!empty) {
				original.attachList("old-list", "Samples", {
					dataTypes: ["SampleText"],
					mapEnabled: true,
					listState: { globalFilter: "Alpha" },
				});
			}
			const state = JSON.parse(JSON.stringify(getActivePinia()!.state.value)) as ReturnType<
				typeof createPinia
			>["state"]["value"];
			expect(state["data-list-map"]).not.toHaveProperty("datasets");
			expect(JSON.stringify(state)).not.toContain("dispose");
			const pinia = createPinia();
			pinia.state.value = state;
			setActivePinia(pinia);
			const metadata = useTeiHeadersStore();
			const discovery = vi.spyOn(metadata.simpleItems, "some");
			const hydrated = useDataListMapStore();
			expect(hydrated.datasets.size).toBe(0);
			await hydrated.initialize({ reuseHydratedState: true });
			expect(discovery).not.toHaveBeenCalled();
			expect(hydrated.records).toEqual(original.records);
			if (!empty) {
				expect(hydrated.layers["configured:samples"]?.markers.map((marker) => marker.id)).toEqual([
					"1",
				]);
				expect(hydrated.layers["configured:samples"]?.enabled).toBe(true);
			}
		},
	);

	it.each(["etag", "pipelineVersion", "projectIdentity", "registryVersion"] as const)(
		"repopulates incompatible %s snapshots",
		async (key) => {
			const store = useDataListMapStore();
			await store.initialize();
			const snapshot = store.initialization!;
			if (key === "etag" || key === "projectIdentity") snapshot[key] = "incompatible";
			else snapshot[key] = -1;
			useTeiHeadersStore().simpleItems = [];
			await store.initialize({ reuseHydratedState: true });
			expect(store.records).toEqual({});
		},
	);

	it("shares lists by data types regardless of opening filters and keeps the first saved state", async () => {
		const store = useDataListMapStore();
		await store.initialize();
		const first = store.attachList("first", "List all samples", {
			dataTypes: ["SampleText"],
			listState: { globalFilter: "Alpha" },
			mapEnabled: true,
		});
		const second = store.attachList("second", "Another title", {
			dataTypes: ["SampleText"],
			listState: { globalFilter: "Beta" },
			mapEnabled: false,
		});
		expect(second).toBe(first);
		expect(first.model?.globalFilter.value).toBe("Alpha");
		expect(first.title.value).toBe("Sample texts");
		expect(first.enabled.value).toBe(true);
		first.model!.globalFilter.value = "No matches";
		await nextTick();
		expect(store.layers["configured:samples"]?.markers).toEqual([]);
		expect(store.records["configured:samples"]?.listState?.globalFilter).toBe("No matches");
		const scoped = store.attachList("scoped", "Alpha only", {
			dataTypes: ["SampleText"],
			filterListBy: { key: "label", value: "Alpha" },
			mapEnabled: true,
		});
		expect(scoped).toBe(first);
		expect(
			store.resolveDatasetId(
				"configured:samples",
				{ dataTypes: ["SampleText"], filterListBy: { key: "label", value: "Alpha" } },
				"changed-list",
			),
		).toBe("configured:samples");
		expect(store.layers.scoped).toBeUndefined();
		expect(Object.keys(store.records)).toEqual(["configured:samples"]);
		expect(
			store
				.mergeMapLayers([{ id: "first", title: "Old", color: "red", markers: [] }])
				.map((layer) => layer.id),
		).toEqual(["configured:samples"]);
	});

	it("uses the first list's opening filter as shared defaults", async () => {
		const store = useDataListMapStore();
		await store.initialize();
		const first = store.attachList("alpha", "Alpha", {
			dataTypes: ["SampleText"],
			filterListBy: { key: "label", value: "Alpha" },
		});
		const second = store.attachList("beta", "Beta", {
			dataTypes: ["SampleText"],
			filterListBy: { key: "label", value: "Beta" },
		});
		expect(second).toBe(first);
		expect(second.items.value.map((item) => item.id)).toEqual(["1"]);
		expect(Object.keys(store.records)).toEqual(["configured:samples"]);
	});

	it("shares unconfigured mixed datasets by an order-independent set of data types", () => {
		const store = useDataListMapStore();
		const first = store.ensureDataset("mixed-first", "First", {
			dataTypes: ["SampleText", "Profile"],
			filterListBy: { key: "label", value: "Alpha" },
		});
		const second = store.ensureDataset("mixed-second", "Second", {
			dataTypes: ["Profile", "SampleText", "SampleText"],
			filterListBy: { key: "label", value: "Beta" },
		});
		expect(second).toBe(first);
		expect(Object.keys(store.records)).toEqual(["mixed-first"]);
		expect(store.resolveDatasetId("mixed-second", { dataTypes: ["Profile", "SampleText"] })).toBe(
			"mixed-first",
		);
	});

	it("consolidates previously registered duplicates when rebuilding a snapshot", async () => {
		const store = useDataListMapStore();
		await store.initialize();
		store.records.legacy = { ...store.records["configured:samples"]!, configured: false };
		store.initialization!.registryVersion = -1;
		await store.initialize({ reuseHydratedState: true });
		expect(Object.keys(store.records)).toEqual(["configured:samples"]);
		expect(store.aliases.legacy).toBe("configured:samples");
	});

	it("reconciles committed metadata replacements and preserves surviving filter state", async () => {
		const store = useDataListMapStore();
		await store.initialize();
		store.attachList("samples", "Samples", {
			dataTypes: ["SampleText"],
			listState: { globalFilter: "Alpha" },
		});
		useTeiHeadersStore().simpleItems = [
			entity("3", "Alpha new"),
			{ ...entity("4", "Profile"), dataType: "Profile" },
		];
		markMetadataReady("project-2");
		await nextTick();
		await store.initialize();
		expect(store.layers["configured:samples"]?.markers.map((marker) => marker.id)).toEqual(["3"]);
		expect(store.records["configured:profiles"]?.enabled).toBe(false);
		useTeiHeadersStore().simpleItems = [];
		markMetadataReady("project-3");
		await nextTick();
		await store.initialize();
		expect(store.records).toEqual({});
		expect(store.datasets.size).toBe(0);
		expect(
			store.mergeMapLayers([
				{ id: "configured:samples", title: "Stale", color: "red", markers: [] },
			]),
		).toEqual([]);
	});

	it("isolates dataset records and runtime models between Pinia instances", async () => {
		const first = useDataListMapStore();
		await first.initialize();
		setActivePinia(createPinia());
		useTeiHeadersStore().simpleItems = [];
		markMetadataReady();
		const second = useDataListMapStore();
		await second.initialize();
		expect(second.records).toEqual({});
		expect(first.records).toHaveProperty("configured:samples");
	});

	it("renders and toggles preloaded buttons without serialized map layers or an open list", async () => {
		const store = useDataListMapStore();
		await store.initialize();
		const wrapper = await mountSuspended(GeoMapWindowContent, {
			props: { params: { endpoint: "data_markers", queryString: "" } },
			global: { plugins: [getActivePinia()!] },
		});
		expect(wrapper.get("button").attributes("aria-label")).toBe("Toggle Sample texts map layer");
		expect(wrapper.get("button").attributes("aria-pressed")).toBe("false");
		await wrapper.get("button").trigger("click");
		expect(wrapper.get("button").attributes("aria-pressed")).toBe("true");
		expect(wrapper.findComponent({ name: "GeoMap" }).exists()).toBe(true);
		wrapper.unmount();
	});
});
