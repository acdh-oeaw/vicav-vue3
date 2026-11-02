// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import CorpusTokenMenu from "./corpus-token-menu.vue";
import DropdownMenu from "./ui/dropdown-menu/DropdownMenu.vue";

const { addWindow } = vi.hoisted(() => ({ addWindow: vi.fn() }));
mockNuxtImport("useWindowsStore", () => () => ({ addWindow }));

const stubs = {
	DropdownMenu: { template: "<div><slot /></div>" },
	DropdownMenuTrigger: { template: "<div><slot /></div>" },
	DropdownMenuContent: { template: "<div><slot /></div>" },
	DropdownMenuItem: { template: "<button @click=\"$emit('select')\"><slot /></button>" },
};

describe("corpus token menu", () => {
	it("opens from the token trigger", async () => {
		const wrapper = await mountSuspended(CorpusTokenMenu, {
			props: { token: { "@id": "word", $: "word" }, actions: ["wordForm"] },
			attachTo: document.body,
		});
		wrapper
			.get('button[aria-label="Actions for word word"]')
			.element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
		await nextTick();
		expect(wrapper.getComponent(DropdownMenu).props("open")).toBe(true);
		expect(document.body.textContent).toContain("Search corpus by word form");
		wrapper.unmount();
	});
	it("closes the previous menu when another token opens", async () => {
		const wrapper = await mountSuspended(
			defineComponent({
				components: { CorpusTokenMenu },
				template: `<div>
					<CorpusTokenMenu :token="{ '@id': 'one', $: 'one' }" :actions="['wordForm']">one</CorpusTokenMenu>
					<CorpusTokenMenu :token="{ '@id': 'two', $: 'two' }" :actions="['wordForm']">two</CorpusTokenMenu>
				</div>`,
			}),
		);
		const menus = wrapper.findAllComponents(DropdownMenu);
		(menus[0]!.vm as { $emit: (event: "update:open", value: boolean) => void }).$emit(
			"update:open",
			true,
		);
		await nextTick();
		expect(menus[0]!.props("open")).toBe(true);
		(menus[1]!.vm as { $emit: (event: "update:open", value: boolean) => void }).$emit(
			"update:open",
			true,
		);
		await nextTick();
		expect(menus[0]!.props("open")).toBe(false);
		expect(menus[1]!.props("open")).toBe(true);
		(menus[0]!.vm as { $emit: (event: "update:open", value: boolean) => void }).$emit(
			"update:open",
			false,
		);
		await nextTick();
		expect(menus[1]!.props("open")).toBe(true);
		wrapper.unmount();
	});

	it("opens searches and dictionary entries for a word", async () => {
		addWindow.mockClear();
		const wrapper = await mountSuspended(CorpusTokenMenu, {
			props: {
				token: { "@id": "word-1", $: "wakt", "@lemmaRef": "dict:DShaAr.wakt_001" },
				actions: ["wordForm", "dictionary", "lemma"],
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
		expect(wrapper.text()).not.toContain("Search corpus by token ID");
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
				actions: ["wordForm"],
			},
			global: { stubs },
		});
		const buttons = wrapper.findAll("button");
		expect(buttons).toHaveLength(1);
		await buttons[0]!.trigger("click");
		expect(
			(addWindow.mock.lastCall?.[0] as { params: { queryString: string } }).params.queryString,
		).toBe('[word="b"] [word="nōb"] within <seg/>');
	});
});
