// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive, ref } from "vue";

import type { DictQueryWindowItem } from "@/types/global.ts";

import DictQueryWindowContent from "./dict-query-window-content.vue";

const { useDictsEntriesMock } = vi.hoisted(() => ({
	useDictsEntriesMock: vi.fn((_params: { queryParams: unknown }) => ({
		data: ref(null),
		isPending: ref(false),
		isPlaceholderData: ref(false),
	})),
}));

mockNuxtImport("useDictStore", () => () => ({
	initialize: () => Promise.resolve(),
	getDictById: () => Promise.resolve(undefined),
}));
mockNuxtImport("useDictsEntries", () => useDictsEntriesMock);

describe("dictionary window query replacement", () => {
	it("updates the active query without remounting and clears the previous entry and pagination", async () => {
		const params = reactive<DictQueryWindowItem["params"]>({
			textId: "test-dict",
			queryString: "",
			isTextInputManual: true,
			isQueryVisible: true,
			queryParams: { id: "old-entry", page: 3, pageSize: 20 },
		});
		const wrapper = await mountSuspended(DictQueryWindowContent, { props: { params } });
		const activeQuery = useDictsEntriesMock.mock.calls.at(-1)?.[0];
		const replacement = reactive({ ...params, queryParams: { q: "lemma=new" } });

		await wrapper.setProps({ params: replacement });
		await nextTick();

		expect(activeQuery).toMatchObject({ queryParams: { q: "lemma=new", page: 1 } });
		expect(replacement.queryParams).not.toHaveProperty("id");
		expect(replacement.queryParams).not.toHaveProperty("pageSize");
		expect(replacement.queryParams.q).toBe("lemma=new");

		await wrapper.setProps({
			params: reactive({ ...params, queryParams: { id: "new-entry" } }),
		});
		await nextTick();

		expect(activeQuery).toMatchObject({ queryParams: { id: "new-entry", page: 1 } });
		expect(activeQuery?.queryParams).not.toHaveProperty("q");
		wrapper.unmount();
	});
});
