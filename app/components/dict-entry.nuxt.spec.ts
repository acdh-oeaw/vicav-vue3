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
	it("shows etymology languages after the senses", async () => {
		const entry = {
			id: "example",
			lemma: "example",
			type: "entry",
			_links: { self: { href: "/example" } },
			entry: {
				entry: {
					sense: { translationEquivalent_cit: { form: { orth: { "@lang": "en", $: "meaning" } } } },
					etym: { etymon_cit: { form: { orth: { "@lang": "tr", $: "badem" } } } },
				},
			},
		} as unknown as RestVLEEntry;
		const wrapper = await mountSuspended(DictEntry, { props: { entry } });
		expect(wrapper.text().indexOf("meaning")).toBeLessThan(wrapper.text().indexOf("Etymology"));
		expect(wrapper.text()).toContain("badem (Turkish)");
		expect(wrapper.get('[lang="tr"]').text()).toBe("badem");
	});

	it("renders derivative forms and variants below inflected forms", async () => {
		const entry = {
			id: "DShaAr.begar_00000",
			lemma: "begar",
			type: "entry",
			_links: { self: { href: "/restvle/dicts/dc_shawi_eng/entries/DShaAr.begar_00000" } },
			entry: {
				entry: {
					inflected_form: { orth: { $: "begar" } },
					derivative_form: {
						orth: { $: "bgara" },
						gramGrp: { pos_gram: { $: "unitNoun" } },
						geographic_usg: { place_name: { $: "Harran-Urfa" } },
						variant_forms: [
							{
								orth: { $: "bgaṛa" },
								geographic_usg: { place_name: { $: "Mayadin" } },
								variant_form: { orth: { $: "nested" } },
							},
						],
					},
				},
			},
		} as unknown as RestVLEEntry;
		const wrapper = await mountSuspended(DictEntry, { props: { entry } });
		const text = wrapper.text();
		expect(text.indexOf("Infl. Forms")).toBeLessThan(text.indexOf("Derived Forms"));
		expect(text).toContain("bgara");
		expect(text).toContain("unitNoun");
		expect(text).toContain("Harran-Urfa");
		expect(text).toContain("bgaṛa");
		expect(text).toContain("Mayadin");
		expect(text).toContain("nested");
		expect(text.match(/unitNoun/g)).toHaveLength(3);
	});

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
				params: {
					queryString:
						'[dict="dict:DShaAr.wakt_001"] | <seg lemmaRef="dict:DShaAr.wakt_001"/> containing []',
					mode: "text",
				},
			}),
			expect.any(String),
			true,
		);
	});
});
