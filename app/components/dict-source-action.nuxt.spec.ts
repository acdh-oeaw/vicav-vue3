// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import DictSourceAction from "./dict-source-action.vue";

const { openOrUpdateWindow } = vi.hoisted(() => ({
	openOrUpdateWindow: vi.fn(),
}));

mockNuxtImport("useOpenOrUpdateWindow", () => {
	return () => openOrUpdateWindow;
});

const reference = {
	sourceId: "source1",
	label: "Lentin 2013, p.164",
	rawReference: "zot:Lentin2013",
	queryString: "Lentin 2013",
};

afterEach(() => {
	openOrUpdateWindow.mockReset();
	document.body.innerHTML = "";
});

describe("dictionary source action", () => {
	it("renders an icon-only native button with a citation-bearing accessible name", async () => {
		const wrapper = await mountSuspended(DictSourceAction, {
			props: { reference },
		});
		const button = wrapper.get("button");

		expect(button.attributes("type")).toBe("button");
		expect(button.attributes("aria-label")).toBe(
			"Open bibliography results for Lentin 2013, p.164",
		);
		expect(button.text()).toBe("");
		expect(button.find("svg").exists()).toBe(true);
	});

	it("reveals the full citation when the button receives keyboard focus", async () => {
		const wrapper = await mountSuspended(DictSourceAction, {
			attachTo: document.body,
			props: { reference },
		});

		await wrapper.get("button").trigger("focus");
		await vi.waitFor(() => {
			expect(document.body.textContent).toContain("Lentin 2013, p.164");
		});
	});

	it("reveals the full citation on pointer hover", async () => {
		const wrapper = await mountSuspended(DictSourceAction, {
			attachTo: document.body,
			props: { reference },
		});
		const button = wrapper.get("button");

		await button.trigger("pointerenter");
		await button.trigger("pointermove");
		await vi.waitFor(() => {
			expect(document.body.textContent).toContain("Lentin 2013, p.164");
		});
	});

	it("opens bibliography results using the normalized query and stops enclosing clicks", async () => {
		const enclosingClick = vi.fn();
		const wrapper = await mountSuspended({
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			components: { DictSourceAction },
			template: '<div @click="enclosingClick"><DictSourceAction :reference="reference" /></div>',
			setup() {
				return { enclosingClick, reference };
			},
		});

		await wrapper.get("button").trigger("click");

		expect(enclosingClick).not.toHaveBeenCalled();
		expect(openOrUpdateWindow).toHaveBeenCalledOnce();
		expect(openOrUpdateWindow).toHaveBeenCalledWith(
			{
				targetType: "BiblioEntries",
				params: { queryString: "Lentin 2013" },
			},
			"Bibliography: Lentin 2013, p.164",
			expect.anything(),
			"queryString",
			true,
		);
	});
});
