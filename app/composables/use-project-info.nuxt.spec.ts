// @vitest-environment nuxt
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { dehydrate, focusManager, hydrate, QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { defineComponent, h, isProxy } from "vue";

import type { ProjectResponse, ReadonlyProjectResponse } from "@/types/project.ts";

import { useProjectInfo } from "./use-project-info.ts";

const { getProject } = vi.hoisted(() => ({ getProject: vi.fn() }));

mockNuxtImport("useApiClient", () => () => ({
	baseUrl: "https://project-refresh.example",
	vicav: { getProject },
}));
mockNuxtImport("useRuntimeConfig", () => () => ({ public: { apiUser: "" } }));

function response(etag: string): ProjectResponse {
	return {
		ETag: etag,
		projectConfig: { title: etag, specialCharacters: [{ value: "š" }] },
	};
}

describe("project query refresh", () => {
	it("replaces hydrated data with frozen snapshots on stale focus refetches", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		const staleTime = 15 * 60 * 1000;
		const server = new QueryClient();
		server.setQueryData(["get-project-info"], response("initial"));
		const client = new QueryClient({ defaultOptions: { queries: { staleTime, retry: false } } });
		hydrate(client, JSON.parse(JSON.stringify(dehydrate(server))));
		getProject.mockReset();
		getProject.mockResolvedValue({ data: response("first-refresh") });
		let query!: ReturnType<typeof useProjectInfo>;
		const wrapper = mount(
			defineComponent({
				setup() {
					query = useProjectInfo();
					return () => h("span", query.data.value?.projectConfig?.title);
				},
			}),
			{ global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } },
		);
		try {
			expectTypeOf(query.data.value).toEqualTypeOf<ReadonlyProjectResponse | undefined>();
			expect(wrapper.text()).toBe("initial");
			expect(isProxy(query.data.value)).toBe(false);
			expect(getProject).not.toHaveBeenCalled();
			for (const [index, etag] of ["first-refresh", "second-refresh", "second-refresh"].entries()) {
				getProject.mockResolvedValue({ data: response(etag) });
				focusManager.setFocused(false);
				vi.setSystemTime(Date.now() + staleTime + 1);
				focusManager.setFocused(true);
				await vi.waitFor(() => {
					expect(getProject).toHaveBeenCalledTimes(index + 1);
					expect(query.isFetching.value).toBe(false);
					expect(query.data.value?.ETag).toBe(etag);
				});
				expect(query.error.value).toBeNull();
				expect(wrapper.text()).toBe(etag);
				expect(Object.isFrozen(query.data.value)).toBe(true);
				expect(Object.isFrozen(query.data.value?.projectConfig?.specialCharacters)).toBe(true);
				expect(client.getQueryData<ReadonlyProjectResponse>(["get-project-info"])).toBe(
					query.data.value,
				);
			}
			expect(getProject).toHaveBeenCalledTimes(3);
		} finally {
			wrapper.unmount();
			server.clear();
			client.clear();
			focusManager.setFocused(undefined);
			vi.useRealTimers();
		}
	});
});
