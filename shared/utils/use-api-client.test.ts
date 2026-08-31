import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type * as ApiClient from "./use-api-client.ts";

const url = "https://example.test/x";

interface PendingFetch {
	resolve: (response: Response) => void;
	reject: (error: unknown) => void;
}

function makeOkResponse(body: unknown, init: { etag: string; maxAge?: number }): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: {
			ETag: init.etag,
			"Cache-Control": `max-age=${String(init.maxAge ?? 10)}`,
		},
	});
}

function make304Response(etag: string): Response {
	return new Response(null, { status: 304, headers: { ETag: etag } });
}

describe("fetchWithETag single-flight", () => {
	let fetchMock: ReturnType<typeof vi.fn>;
	let originalFetch: typeof globalThis.fetch;
	let pendingFetch: PendingFetch | null;
	let moduleRef: typeof ApiClient;

	beforeEach(async () => {
		vi.resetModules();
		originalFetch = globalThis.fetch;
		pendingFetch = null;
		fetchMock = vi.fn(
			() =>
				new Promise<Response>((resolve, reject) => {
					pendingFetch = { resolve, reject };
				}),
		);
		globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
		moduleRef = await import("./use-api-client.ts");
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.useRealTimers();
	});

	test("8 concurrent callers trigger exactly one fetch", async () => {
		const calls = Array.from({ length: 8 }, () => moduleRef.fetchWithETag(url));
		expect(fetchMock).toHaveBeenCalledTimes(1);

		const body = { ok: true, n: 1 };
		pendingFetch!.resolve(makeOkResponse(body, { etag: '"v1"' }));

		const responses = await Promise.all(calls);
		for (const r of responses) {
			expect(r).toBeInstanceOf(Response);
			expect(r.status).toBe(200);
		}
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test("every awaiter gets a body it can read independently", async () => {
		const calls = Array.from({ length: 8 }, () => moduleRef.fetchWithETag(url));
		const body = { ok: true, payload: "hello" };
		pendingFetch!.resolve(makeOkResponse(body, { etag: '"v1"' }));

		const responses = await Promise.all(calls);
		const parsed = await Promise.all(responses.map((r) => r.json()));
		expect(parsed).toEqual(Array.from({ length: 8 }, () => body));
	});

	test("in-flight map is cleared after the last awaiter resolves; 9th call is a cache hit", async () => {
		const first = Array.from({ length: 8 }, () => moduleRef.fetchWithETag(url));
		pendingFetch!.resolve(makeOkResponse({ n: 1 }, { etag: '"v1"' }));
		const firstResponses = await Promise.all(first);
		expect(firstResponses[0]?.headers.get("X-Cache")).toBeNull();

		// 9th caller: in-flight map must be empty so this is a fresh call;
		// the cache (just populated with max-age=10) must serve it.
		const ninth = await moduleRef.fetchWithETag(url);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(ninth.headers.get("X-Cache")).toBe("fetchWithETag HIT");
		await expect(ninth.json()).resolves.toEqual({ n: 1 });
	});

	test("failed fetch with cached body returns the cached body (200)", async () => {
		// Pre-warm the cache.
		const first = moduleRef.fetchWithETag(url);
		pendingFetch!.resolve(makeOkResponse({ cached: "yes" }, { etag: '"v1"' }));
		const firstResponse = await first;
		await firstResponse.arrayBuffer();

		// Next call: fetch rejects, but the cached body should be served.
		const second = moduleRef.fetchWithETag(url);
		pendingFetch!.reject(new Error("network down"));
		const secondResponse = await second;
		expect(secondResponse.status).toBe(200);
		await expect(secondResponse.json()).resolves.toEqual({ cached: "yes" });
	});

	test("failed fetch with no cached body throws a wrapped error", async () => {
		const call = moduleRef.fetchWithETag(url);
		pendingFetch!.reject(new Error("network down"));
		await expect(call).rejects.toThrow(/Could not fetch and cache with ETag/);
		await expect(call).rejects.toThrow(/network down/);
	});

	test("304 Not Modified refreshes expiresAt and returns the cached body", async () => {
		// Use fake timers so we can let the cache entry expire deterministically.
		// `Date.now()` is the only wall-clock the source reads, so advancing it
		// is enough to flip the entry from fresh to expired.
		vi.useFakeTimers();
		// Re-evaluate `new Date()` against the fake clock; the source uses
		// `new Date()` (not `Date.now()`) in the cache-hit guard, so setting
		// the system clock via `setSystemTime` is required.
		vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

		// First call: prime the cache with body { a: 1 } and ETag "v1".
		const first = moduleRef.fetchWithETag(url);
		pendingFetch!.resolve(makeOkResponse({ a: 1 }, { etag: '"v1"', maxAge: 1 }));
		const firstResponse = await first;
		await firstResponse.arrayBuffer();

		// Advance past the 1-second TTL.
		vi.setSystemTime(new Date("2025-01-01T00:00:10Z"));

		// Second call: cache is expired but the ETag is still in the map, so
		// the source must send If-None-Match: "v1" and the upstream returns 304.
		const second = moduleRef.fetchWithETag(url);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const secondCallInit = fetchMock.mock.calls[1]?.[1] as RequestInit | undefined;
		const headers = secondCallInit?.headers as Record<string, string> | undefined;
		expect(headers?.["If-None-Match"]).toBe('"v1"');

		pendingFetch!.resolve(make304Response('"v1"'));
		const secondResponse = await second;
		expect(secondResponse.status).toBe(200);
		// The body served should be the cached body, not the empty 304 body.
		await expect(secondResponse.json()).resolves.toEqual({ a: 1 });
	});
});
