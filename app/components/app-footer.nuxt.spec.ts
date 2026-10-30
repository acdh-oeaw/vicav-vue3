// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";

import AppFooter from "./app-footer.vue";

mockNuxtImport("useProjectInfo", () => () => ({ data: { value: undefined } }));

describe("app footer", () => {
	it("expands its content panel on hover while keeping the footer bar stationary", async () => {
		const wrapper = await mountSuspended(AppFooter);
		const footer = wrapper.get("footer");
		const content = wrapper.get("#footer-content");
		const footerElement = footer.element as HTMLElement;
		const contentElement = content.element as HTMLElement;

		expect(content.classes()).toContain("absolute");
		expect(contentElement.style.transform).toBe("translateY(calc(100% + 2rem))");

		await wrapper.get('button[aria-label="Expand footer"]').trigger("mouseover");

		expect(contentElement.style.transform).toBe("translateY(0)");
		expect(footerElement.style.transform).toBe("");

		await footer.trigger("mouseleave");

		expect(contentElement.style.transform).toBe("translateY(calc(100% + 2rem))");
	});

	it("expands when its trigger receives keyboard focus", async () => {
		const wrapper = await mountSuspended(AppFooter);
		const content = wrapper.get("#footer-content");
		const contentElement = content.element as HTMLElement;

		await wrapper.get('button[aria-label="Expand footer"]').trigger("focus");

		expect(contentElement.style.transform).toBe("translateY(0)");
	});
});
