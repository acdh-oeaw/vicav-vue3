// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RestVLEEntry } from "@/lib/api-client";

import DictEntry from "./dict-entry.vue";

const { openOrUpdateWindow } = vi.hoisted(() => ({
	openOrUpdateWindow: vi.fn(),
}));

mockNuxtImport("useOpenOrUpdateWindow", () => {
	return () => openOrUpdateWindow;
});

afterEach(() => {
	openOrUpdateWindow.mockReset();
});

describe("dictionary entry corpus search", () => {
	it("opens a corpus query using the dictionary identifier", async () => {
		const entry = {
			id: "DShaAr.wakt_001",
			lemma: "wakt",
			type: "entry",
			_links: { self: { href: "/restvle/dicts/dict/entries/DShaAr.wakt_001" } },
			entry: { entry: {} },
		} as unknown as RestVLEEntry;
		const wrapper = await mountSuspended(DictEntry, { props: { entry } });

		await wrapper.get('button[aria-label="search lemma in corpus"]').trigger("click");

		expect(openOrUpdateWindow).toHaveBeenCalledWith(
			expect.objectContaining({
				params: { queryString: '[dict=="dict:DShaAr.wakt_001"]' },
			}),
			expect.any(String),
			expect.anything(),
			"queryString",
			true,
		);
	});
});
