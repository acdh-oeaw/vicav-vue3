// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import MultiValueSearchbar from "./multi-value-searchbar.vue";
import Searchbar from "./searchbar.vue";
import TagSearchbar from "./tag-searchbar.vue";

describe("Searchbar mode", () => {
	it("starts in text mode when requested", async () => {
		const query = '[dict="dict:DShaAr.wakt_001"] | [] within <seg lemmaRef="DShaAr.wakt_001"/>';
		const wrapper = await mountSuspended(Searchbar, {
			props: {
				modelValue: query,
				mode: "text",
				triggers: new Map(),
				queryMode: "cql",
			},
		});

		expect(wrapper.findComponent(MultiValueSearchbar).exists()).toBe(true);
		expect(wrapper.findComponent(TagSearchbar).exists()).toBe(false);
		expect(wrapper.find('[data-onboarding="query-mode-toggle"]').attributes("title")).toBe(
			"Switch to tag mode",
		);
	});

	it("reacts to mode changes without changing the query", async () => {
		const query = '[dict="dict:DShaAr.wakt_001"] | [] within <seg lemmaRef="DShaAr.wakt_001"/>';
		const wrapper = await mountSuspended(Searchbar, {
			props: {
				modelValue: query,
				triggers: new Map(),
				queryMode: "cql",
			},
		});

		await wrapper.setProps({ mode: "text" });
		await nextTick();

		expect(wrapper.findComponent(MultiValueSearchbar).exists()).toBe(true);
		expect(wrapper.findComponent(TagSearchbar).exists()).toBe(false);
		expect(wrapper.props("modelValue")).toBe(query);
	});
});
