// @vitest-environment nuxt
import { mockComponent, mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { describe, expect, it, vi } from "vitest";
import { reactive } from "vue";

import type { DictQueryWindowItem } from "@/types/global.ts";

import WindowContent from "./window-content.vue";

mockComponent("GeoMapWindowContent", () => ({ template: "<div />" }));
mockComponent("TextWindowContent", () => ({ template: "<div />" }));
mockComponent("SampleTextWindowContent", () => ({ template: "<div />" }));
mockComponent("ProfileWindowContent", () => ({ template: "<div />" }));
mockComponent("FeatureWindowContent", () => ({ template: "<div />" }));
mockComponent("FeatureStatisticsWindowContent", () => ({ template: "<div />" }));
mockComponent("FeatureValueWindowContent", () => ({ template: "<div />" }));
mockComponent("LocationWindowContent", () => ({ template: "<div />" }));
mockComponent("BiblioEntriesWindowContent", () => ({ template: "<div />" }));
mockComponent("GeojsonTableWindowContent", () => ({ template: "<div />" }));
mockComponent("GeojsonMapWindowContent", () => ({ template: "<div />" }));
mockComponent("CorpusQueryWindowContent", () => ({ template: "<div />" }));
mockComponent("CorpusTextJsonWindowContent", () => ({ template: "<div />" }));
mockComponent("DataListWindowContent", () => ({ template: "<div />" }));
mockComponent("DataTableWindowContent", () => ({ template: "<div />" }));
mockComponent("ExploreSamplesFormWindowContent", () => ({ template: "<div />" }));
mockComponent("ExploreSamplesWindowContent", () => ({ template: "<div />" }));

const { request } = vi.hoisted(() => ({
	request: vi.fn((_dict: string, query: { id?: string }) =>
		Promise.resolve({
			data: { page: "1", page_size: "20", total_items: query.id, _embedded: { entries: [] } },
		}),
	),
}));

mockNuxtImport("useApiClient", () => () => ({ restvle: { getDictDictNameEntries: request } }));
mockNuxtImport("useDictStore", () => () => ({
	initialize: () => Promise.resolve(),
	getDictById: () => Promise.resolve({ id: "test-dict", queryTemplates: new Map() }),
}));
mockNuxtImport("useWindowsStore", () => () => ({ updateQueryParam: vi.fn() }));

describe("dictionary window content refresh", () => {
	it("requests and renders a second entry when the existing window parameters change", async () => {
		const item = reactive({
			id: "window-test",
			targetType: "DictQuery",
			params: {
				textId: "test-dict",
				queryString: "",
				isTextInputManual: false,
				isQueryVisible: false,
				queryParams: { id: "111" },
			},
		} as DictQueryWindowItem);
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const wrapper = await mountSuspended(WindowContent, {
			props: { item },
			global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
		});
		await vi.waitFor(() => {
			expect(wrapper.text()).toContain("Total items: 111");
		});
		item.params = { ...item.params, queryParams: { id: "222" } };
		await vi.waitFor(() => {
			expect(request).toHaveBeenCalledWith(
				"test-dict",
				expect.objectContaining({ id: "222" }),
				expect.anything(),
			);
		});
		await vi.waitFor(() => {
			expect(wrapper.text()).toContain("Total items: 222");
		});
		wrapper.unmount();
		client.clear();
	});
});
