// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";

import CorpusTokenMenu from "./corpus-token-menu.vue";

const { addWindow } = vi.hoisted(() => ({ addWindow: vi.fn() }));
mockNuxtImport("useWindowsStore", () => () => ({ addWindow }));

const stubs = {
	DropdownMenu: { template: "<div><slot /></div>" },
	DropdownMenuTrigger: { template: "<div><slot /></div>" },
	DropdownMenuContent: { template: "<div><slot /></div>" },
	DropdownMenuItem: { template: "<button @click=\"$emit('select')\"><slot /></button>" },
};

describe("corpus token menu", () => {
	it("opens searches and dictionary entries for a word", async () => {
		addWindow.mockClear();
		const wrapper = await mountSuspended(CorpusTokenMenu, {
			props: {
				token: { "@id": "word-1", $: "wakt", "@lemmaRef": "dict:DShaAr.wakt_001" },
				actions: ["wordForm", "dictionary", "tokenId", "lemma"],
			},
			global: { stubs },
		});
		const buttons = wrapper.findAll("button");
		await buttons[1]!.trigger("click");
		expect(
			(addWindow.mock.lastCall?.[0] as { params: { queryString: string } }).params.queryString,
		).toBe('[word="wakt"]');
		await buttons[2]!.trigger("click");
		expect(
			(addWindow.mock.lastCall?.[0] as { params: { queryParams: { id: string } } }).params
				.queryParams.id,
		).toBe("DShaAr.wakt_001");
		await buttons[4]!.trigger("click");
		expect(
			(addWindow.mock.lastCall?.[0] as { params: { queryString: string } }).params.queryString,
		).toBe('[wid="word-1"]');
	});

	it("constructs compound searches and respects configured actions", async () => {
		addWindow.mockClear();
		const wrapper = await mountSuspended(CorpusTokenMenu, {
			props: {
				token: {
					"@id": "seg-1",
					$$: [{ w: { "@id": "w1", $: "b" } }, { w: { "@id": "w2", $: "nōb" } }],
				},
				compound: true,
				actions: ["wordForm", "tokenId"],
			},
			global: { stubs },
		});
		const buttons = wrapper.findAll("button");
		expect(buttons).toHaveLength(3);
		await buttons[1]!.trigger("click");
		expect(
			(addWindow.mock.lastCall?.[0] as { params: { queryString: string } }).params.queryString,
		).toBe('[word="b"] [word="nōb"] within <seg/>');
		await buttons[2]!.trigger("click");
		expect(
			(addWindow.mock.lastCall?.[0] as { params: { queryString: string } }).params.queryString,
		).toBe('[] within <seg id="seg-1"/>');
	});
});
