// @vitest-environment nuxt
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isReactive } from "vue";

const { mockedProjectInfo } = vi.hoisted(() => {
	const data: { value: unknown } = { value: undefined };
	return {
		mockedProjectInfo: {
			data,
			suspense: vi.fn(() => Promise.resolve()),
		},
	};
});

mockNuxtImport("useProjectInfo", () => {
	return () => ({
		data: mockedProjectInfo.data,
		suspense: mockedProjectInfo.suspense,
	});
});

interface ParseCounter {
	count: number;
}

function makeTeiCorpusItem(id: string) {
	return {
		"@id": id,
		TEIs: [
			{
				"@id": `${id}-tei-1`,
				teiHeader: {
					fileDesc: {
						titleStmt: { titles: [{ $: `Title ${id}` }] },
						publicationStmt: { publishers: [], idno: { $: `${id}-tei-1` } },
						sourceDesc: {},
					},
				},
			},
		],
	};
}

/**
 * Builds a mocked `/vicav/project` envelope. The `table` getter counts how often the parse
 * pipeline actually consumes the static data: memo hits and in-flight-dedup hits never read it.
 */
function makeEnvelope(etag: string | undefined, counter: ParseCounter) {
	return {
		ETag: etag,
		projectConfig: {
			staticData: {
				get table() {
					counter.count += 1;
					return [makeTeiCorpusItem("corpus")];
				},
			},
		},
	};
}

async function importStoreModule() {
	return await import("./use-tei-headers-store.ts");
}

async function createInitializedStore() {
	const { useTeiHeadersStore } = await importStoreModule();
	setActivePinia(createPinia());
	const store = useTeiHeadersStore();
	await store.initialize();
	return store;
}

describe("useTeiHeadersStore ETag memo", () => {
	// The memo and the in-flight dedup map are module-scope, so every test re-imports the store
	// module to get fresh module state.
	beforeEach(() => {
		vi.resetModules();
		mockedProjectInfo.suspense.mockClear();
	});

	it("parses the corpus on the first request and populates the store", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope("ETAG-COLD", counter);

		const store = await createInitializedStore();

		expect(counter.count).toBe(1);
		expect(store.simpleItems.length).toBeGreaterThan(0);
		expect(store.simpleItems[0]?.id).toBe("corpus-tei-1");
		expect(store.simpleItems[0]?.title).toBe("Title corpus");
	});

	it("serves subsequent requests for the same ETag from the memo without re-parsing", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope("ETAG-WARM", counter);

		const first = await createInitializedStore();
		const second = await createInitializedStore();

		expect(counter.count).toBe(1);
		expect(second.rawItems).toBe(first.rawItems);
		expect(second.simpleItems).toBe(first.simpleItems);
		expect(second.persons).toBe(first.persons);
	});

	it("runs the parse pipeline exactly once for concurrent cold requests for the same ETag", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope("ETAG-CONCURRENT", counter);

		const { useTeiHeadersStore } = await importStoreModule();
		const stores = Array.from({ length: 5 }, () => {
			setActivePinia(createPinia());
			return useTeiHeadersStore();
		});

		await Promise.all(stores.map((store) => store.initialize()));

		expect(counter.count).toBe(1);
		for (const store of stores) {
			expect(store.rawItems).toBe(stores[0]!.rawItems);
			expect(store.simpleItems).toBe(stores[0]!.simpleItems);
			expect(store.persons).toBe(stores[0]!.persons);
		}
	});

	it("evicts the least recently used ETag once the memo exceeds its capacity", async () => {
		const { useTeiHeadersStore } = await importStoreModule();
		const counters = new Map<string, ParseCounter>();

		async function initializeWithEtag(etag: string): Promise<ParseCounter> {
			const counter = counters.get(etag) ?? { count: 0 };
			counters.set(etag, counter);
			mockedProjectInfo.data.value = makeEnvelope(etag, counter);
			setActivePinia(createPinia());
			await useTeiHeadersStore().initialize();
			return counter;
		}

		// The memo is capped at 4 entries: the fifth distinct ETag evicts the first one.
		for (const etag of ["ETAG-LRU-1", "ETAG-LRU-2", "ETAG-LRU-3", "ETAG-LRU-4", "ETAG-LRU-5"]) {
			await initializeWithEtag(etag);
		}
		expect(counters.get("ETAG-LRU-1")?.count).toBe(1);

		// Re-requesting the evicted ETag parses again (and evicts the second-oldest entry)...
		expect((await initializeWithEtag("ETAG-LRU-1")).count).toBe(2);

		// ...while a still-cached ETag keeps being served from the memo.
		expect((await initializeWithEtag("ETAG-LRU-3")).count).toBe(1);
	});

	it("falls back to per-request parsing and warns once when the response has no ETag", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope(undefined, counter);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		try {
			const first = await createInitializedStore();
			const second = await createInitializedStore();

			expect(counter.count).toBe(2);
			expect(first.simpleItems.length).toBeGreaterThan(0);
			expect(second.simpleItems.length).toBeGreaterThan(0);
			// Nothing is shared: each request gets its own freshly parsed copy.
			expect(second.simpleItems).not.toBe(first.simpleItems);
			expect(warnSpy).toHaveBeenCalledTimes(1);
		} finally {
			warnSpy.mockRestore();
		}
	});

	it("hands out deeply frozen, non-reactive data on a memo hit", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope("ETAG-FROZEN", counter);

		await createInitializedStore();
		const store = await createInitializedStore();

		expect(Object.isFrozen(store.rawItems)).toBe(true);
		expect(Object.isFrozen(store.simpleItems)).toBe(true);
		expect(Object.isFrozen(store.persons)).toBe(true);
		expect(Object.isFrozen(store.simpleItems[0]?.teiHeader)).toBe(true);
		expect(Object.isFrozen(store.simpleItems[0]?.teiHeader.fileDesc)).toBe(true);
		expect(Object.isFrozen(store.simpleItems[0]?.author)).toBe(true);
		expect(isReactive(store.rawItems)).toBe(false);
		expect(isReactive(store.simpleItems)).toBe(false);

		// Representative existing consumer patterns keep working unmodified.
		const found = store.simpleItems.find((item) => item.id === "corpus-tei-1");
		expect(found?.label).toBe("Title corpus");
		expect(found?.title).toBe("Title corpus");
	});
});
