// @vitest-environment nuxt
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isReactive, reactive } from "vue";

const { mockedProjectInfo, mockedRuntimeConfig } = vi.hoisted(() => {
	const data: { value: unknown } = { value: undefined };
	return {
		mockedRuntimeConfig: {
			public: { apiBaseUrl: "https://project-a.example" },
			apiBaseUrl: undefined as string | undefined,
		},
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

mockNuxtImport("useRuntimeConfig", () => () => mockedRuntimeConfig);

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
		mockedProjectInfo.suspense.mockReset();
		mockedProjectInfo.suspense.mockResolvedValue(undefined);
		mockedRuntimeConfig.public.apiBaseUrl = "https://project-a.example";
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

		expect(Object.isFrozen(store.simpleItems)).toBe(true);
		expect(Object.isFrozen(store.persons)).toBe(true);
		expect(Object.isFrozen(store.simpleItems[0]?.author)).toBe(true);
		expect(isReactive(store.simpleItems)).toBe(false);

		// Representative existing consumer patterns keep working unmodified.
		const found = store.simpleItems.find((item) => item.id === "corpus-tei-1");
		expect(found?.label).toBe("Title corpus");
		expect(found?.title).toBe("Title corpus");
	});
	it("isolates cached entries for different backends with the same ETag", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope("SHARED-ETAG", counter);
		const first = await createInitializedStore();
		mockedRuntimeConfig.public.apiBaseUrl = "https://project-b.example";
		const second = await createInitializedStore();
		expect(counter.count).toBe(2);
		expect(second.simpleItems).not.toBe(first.simpleItems);
	});

	it("rebuilds an existing store when the ETag changes", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope("OLD", counter);
		const store = await createInitializedStore();
		const original = store.simpleItems;
		mockedProjectInfo.data.value = makeEnvelope("NEW", counter);
		await store.initialize();
		expect(counter.count).toBe(2);
		expect(store.simpleItems).not.toBe(original);
		expect(store.initialization?.etag).toBe("NEW");
	});

	it("retries after a failed build without publishing partial state", async () => {
		const envelope = makeEnvelope("RETRY", { count: 0 });
		let shouldFail = true;
		Object.defineProperty(envelope.projectConfig.staticData, "table", {
			get() {
				if (shouldFail) throw new Error("unavailable data");
				return [makeTeiCorpusItem("recovered")];
			},
		});
		mockedProjectInfo.data.value = envelope;
		const { useTeiHeadersStore } = await importStoreModule();
		setActivePinia(createPinia());
		const store = useTeiHeadersStore();
		await expect(store.initialize()).rejects.toThrow("unavailable data");
		expect(store.initialization).toBeNull();
		expect(store.simpleItems).toEqual([]);
		shouldFail = false;
		await store.initialize();
		expect(store.simpleItems[0]?.id).toBe("recovered-tei-1");
	});

	it("removes unused corpus/header copies from serialized store state", async () => {
		mockedProjectInfo.data.value = makeEnvelope("COMPACT", { count: 0 });
		const store = await createInitializedStore();
		expect(store.$state).not.toHaveProperty("rawItems");
		expect(store.simpleItems[0]).not.toHaveProperty("teiHeader");
		expect(store.simpleItems[0]).toHaveProperty("publication");
	});

	it.each([false, true])(
		"reuses a hydrated snapshot without reading raw tables (empty=%s)",
		async (empty) => {
			const counter = { count: 0 };
			const envelope = makeEnvelope("HYDRATED", counter);
			if (empty)
				Object.defineProperty(envelope.projectConfig.staticData, "table", {
					get() {
						counter.count++;
						return [];
					},
				});
			mockedProjectInfo.data.value = envelope;
			const original = await createInitializedStore();
			const state = JSON.parse(JSON.stringify(original.$state)) as typeof original.$state;
			vi.resetModules();
			const { useTeiHeadersStore } = await importStoreModule();
			const pinia = createPinia();
			pinia.state.value["use-tei-headers-store"] = state;
			setActivePinia(pinia);
			const hydrated = useTeiHeadersStore();
			await hydrated.initialize({ reuseHydratedState: true });
			expect(counter.count).toBe(1);
			expect(hydrated.simpleItems).toEqual(original.simpleItems);
			expect(Object.isFrozen(hydrated.simpleItems)).toBe(true);
			expect(isReactive(hydrated.simpleItems)).toBe(false);
		},
	);

	it.each(["pipelineVersion", "projectIdentity", "etag"] as const)(
		"rebuilds incompatible hydration metadata: %s",
		async (key) => {
			const counter = { count: 0 };
			mockedProjectInfo.data.value = makeEnvelope("HYDRATED", counter);
			const original = await createInitializedStore();
			const state = JSON.parse(JSON.stringify(original.$state)) as typeof original.$state;
			if (key === "pipelineVersion") state.initialization!.pipelineVersion = -1;
			else state.initialization![key] = "incompatible";
			vi.resetModules();
			const { useTeiHeadersStore } = await importStoreModule();
			const pinia = createPinia();
			pinia.state.value["use-tei-headers-store"] = state;
			setActivePinia(pinia);
			await useTeiHeadersStore().initialize({ reuseHydratedState: true });
			expect(counter.count).toBe(2);
		},
	);

	it("resolves named references and inline authors, preserving first-match order and fallbacks", async () => {
		const item = makeTeiCorpusItem("vicav_corpus");
		const namedReference = {
			"@ref": "corpus:AB",
			forename: { $: "First" },
			surname: { $: "Author" },
		};
		const responsibility = (persName: unknown, resp = "author") => ({
			persName,
			resp: { $: resp },
		});
		const header = item.TEIs[0]!.teiHeader;
		mockedProjectInfo.data.value = reactive({
			ETag: "AUTHORS",
			projectConfig: {
				staticData: {
					table: [
						{
							...item,
							teiHeader: {
								...header,
								fileDesc: {
									...header.fileDesc,
									titleStmt: {
										titles: [],
										respStmts: [
											responsibility(namedReference),
											responsibility({ ...namedReference, forename: { $: "Duplicate" } }),
										],
									},
								},
							},
							TEIs: [
								{
									...item.TEIs[0],
									teiHeader: {
										...header,
										fileDesc: {
											...header.fileDesc,
											titleStmt: {
												...header.fileDesc.titleStmt,
												respStmts: [
													responsibility({ "@ref": "corpus:AB" }),
													responsibility({ name: { $: "Inline Author" } }),
													responsibility({ "@ref": "corpus:missing" }),
													{ resp: { $: "author" } },
												],
											},
										},
									},
								},
							],
						},
					],
				},
			},
		});
		const store = await createInitializedStore();
		expect(store.simpleItems[0]?.author).toEqual([
			{ given: "First", family: "Author" },
			{ given: "Inline Author", family: "" },
			{ given: "", family: "" },
			{ given: "", family: "" },
		]);
	});

	it("rejects an entire invalid corpus while retaining valid sibling corpora", async () => {
		const invalid = makeTeiCorpusItem("invalid");
		const valid = makeTeiCorpusItem("valid");
		mockedProjectInfo.data.value = {
			ETag: "INVALID",
			projectConfig: {
				staticData: { table: [{ ...invalid, TEIs: [{ ...invalid.TEIs[0], "@id": 123 }] }, valid] },
			},
		};
		const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			const store = await createInitializedStore();
			expect(store.simpleItems.map((item) => item.id)).toEqual(["valid-tei-1"]);
			expect(error).toHaveBeenCalled();
		} finally {
			error.mockRestore();
		}
	});
	it("retries a rejected shared parse after all concurrent waiters fail", async () => {
		let fail = true;
		const broken = makeTeiCorpusItem("broken");
		Object.defineProperty(broken, "TEIs", {
			get() {
				if (fail) throw new Error("parse input failed");
				return [];
			},
		});
		mockedProjectInfo.data.value = {
			ETag: "SHARED-RETRY",
			projectConfig: { staticData: { table: [broken] } },
		};
		const { useTeiHeadersStore } = await importStoreModule();
		const stores = [createPinia(), createPinia()].map((pinia) => useTeiHeadersStore(pinia));
		const results = await Promise.allSettled(stores.map((store) => store.initialize()));
		expect(results.map((result) => result.status)).toEqual(["rejected", "rejected"]);
		for (const store of stores) expect(store.initialization).toBeNull();
		fail = false;
		await stores[0]!.initialize();
		expect(stores[0]!.initialization?.ready).toBe(true);
	});

	it("hydrates data without an ETag but rebuilds on a later explicit initialization", async () => {
		const counter = { count: 0 };
		mockedProjectInfo.data.value = makeEnvelope(undefined, counter);
		const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		try {
			const store = await createInitializedStore();
			await store.initialize({ reuseHydratedState: true });
			expect(counter.count).toBe(1);
			await store.initialize();
			expect(counter.count).toBe(2);
		} finally {
			warning.mockRestore();
		}
	});

	it("uses first person definitions and preserves TEI reference order", async () => {
		const corpus = makeTeiCorpusItem("vicav_corpus");
		const header = corpus.TEIs[0]!.teiHeader;
		mockedProjectInfo.data.value = {
			ETag: "PERSON-INDEX",
			projectConfig: {
				staticData: {
					table: [
						{
							...corpus,
							teiHeader: {
								...header,
								profileDesc: {
									particDesc: {
										listPerson: [
											{ "@id": "first", "@age": "30" },
											{ "@id": "first", "@age": "90" },
											{ "@id": "second", "@age": "40" },
										],
									},
								},
							},
							TEIs: [
								{
									...corpus.TEIs[0],
									teiHeader: {
										...header,
										profileDesc: {
											particDesc: {
												listPerson: [
													{ "@sameAs": "corpus:second" },
													{ "@sameAs": "corpus:missing" },
													{ "@sameAs": "corpus:first" },
												],
											},
										},
									},
								},
							],
						},
					],
				},
			},
		};
		const store = await createInitializedStore();
		expect(store.simpleItems[0]?.person.map(({ name, age }) => ({ name, age }))).toEqual([
			{ name: "second", age: "40" },
			{ name: "first", age: "30" },
		]);
	});
});
