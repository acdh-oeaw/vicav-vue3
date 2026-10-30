// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Seg } from "@/lib/api-client";

import CorpusTextJsonUtterance from "./corpus-text-json-utterance.vue";

const { addWindow } = vi.hoisted(() => ({ addWindow: vi.fn() }));

mockNuxtImport("useWindowsStore", () => {
	return () => ({ addWindow });
});

const compound = {
	"@id": "seg-1",
	"@lemmaRef": "dict:DShaAr.wakt_in_000",
	"@msd": "compound",
	pos: "adverb",
	synRoots: ["w-q-t", "ʔ-n"],
	$$: [
		{
			w: {
				$: "wakt",
				"@id": "word-1",
				"@join": "right",
				"@lemmaRef": "dict:DShaAr.wakt_001",
				pos: "noun",
			},
		},
		{ w: { $: "in", "@id": "word-2", pos: "preposition" } },
	],
} as unknown as Seg;

describe("compound corpus utterances", () => {
	beforeEach(() => {
		addWindow.mockReset();
	});

	it("keeps the compound boundary when both annotation capabilities are off", async () => {
		const wrapper = await mountSuspended(CorpusTextJsonUtterance, {
			props: {
				utterance: { seg: compound },
				inlineLinguisticAnnotation: false,
				menuActions: [],
			},
		});

		expect(wrapper.find('[data-compound-id="seg-1"]').exists()).toBe(true);
		expect(wrapper.text()).toContain("waktin");
		expect(wrapper.findAll("button")).toHaveLength(0);
		expect(wrapper.text()).not.toContain("compound");
	});

	it("renders and activates compound and word lemmas independently", async () => {
		const wrapper = await mountSuspended(CorpusTextJsonUtterance, {
			props: {
				utterance: { seg: compound },
				inlineLinguisticAnnotation: false,
			},
		});

		expect(
			wrapper.find('[role="button"][aria-label="Actions for compound wakt in"]').exists(),
		).toBe(true);
		expect(wrapper.find('button[aria-label="Actions for word wakt"]').exists()).toBe(true);
		expect(wrapper.find('button[aria-label="Actions for word in"]').exists()).toBe(true);
	});

	it("renders POS and MSD annotations without exposing root elements", async () => {
		const wrapper = await mountSuspended(CorpusTextJsonUtterance, {
			props: {
				utterance: { seg: compound },
				inlineLinguisticAnnotation: true,
				menuActions: [],
			},
		});

		expect(wrapper.text()).toContain("compound");
		expect(wrapper.text()).toContain("noun");
		expect(wrapper.text()).not.toContain("w-q-t");
		expect(wrapper.text()).not.toContain("ʔ-n");
		expect(wrapper.findAll("button")).toHaveLength(0);
	});

	it("distinguishes segment hits from nested word hits", async () => {
		const wrapper = await mountSuspended(CorpusTextJsonUtterance, {
			props: {
				utterance: { seg: compound },
				inlineLinguisticAnnotation: false,
				hits: "seg-1",
			},
		});

		expect(wrapper.get('[data-compound-id="seg-1"]').attributes("data-highlight-scope")).toBe(
			"segment",
		);
		expect(wrapper.find('[data-highlight-scope="word"]').exists()).toBe(false);

		await wrapper.setProps({ hits: "word-1" });
		expect(wrapper.get('[data-compound-id="seg-1"]').attributes("data-highlight-scope")).toBe(
			undefined,
		);
		expect(wrapper.get("#word-1").attributes("data-highlight-scope")).toBe("word");
	});

	it("highlights multiple nested hits and reacts to changed hit arrays", async () => {
		const wrapper = await mountSuspended(CorpusTextJsonUtterance, {
			props: {
				utterance: { seg: compound },
				inlineLinguisticAnnotation: false,
				hits: ["word-1", "word-2"],
				highlight: true,
			},
		});
		expect(wrapper.findAll('[data-highlight-scope="word"]')).toHaveLength(2);
		expect(wrapper.get("#seg-1").attributes("data-highlight-scope")).toBeUndefined();
		await wrapper.setProps({ hits: ["seg-1", "word-2", "missing"] });
		expect(wrapper.get("#seg-1").attributes("data-highlight-scope")).toBe("segment");
		expect(wrapper.get("#word-1").attributes("data-highlight-scope")).toBeUndefined();
		expect(wrapper.get("#word-2").attributes("data-highlight-scope")).toBe("word");
		await wrapper.setProps({ hits: [] });
		expect(wrapper.findAll("[data-highlight-scope]")).toHaveLength(0);
	});
});
