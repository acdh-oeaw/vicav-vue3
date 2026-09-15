import { Api, type RequestParams } from "@/lib/api-client";

interface userPass {
	user: string;
	pass: string;
}

let api = new Api<userPass>();

function basicSecurityWorker(securityData: userPass | null): RequestParams | undefined {
	if (securityData) {
		return {
			headers: { authorization: `Basic ${btoa(`${securityData.user}:${securityData.pass}`)}` },
		};
	}
	return undefined;
}

// The dev server seems to isolate api routes and frontend requests,
// so shared global variables do not work there.
// The node code produced with build has a shared global scope.

// This cache stores for each URL a mapping of ETag to response body and expiration date.
const cache = new Map<string, { ETag: string; body: Uint8Array<ArrayBuffer>; expiresAt: Date }>();
// Avoid multiple simultaneous requests for the same URL + query params.
// The rest of the code at the moment only works for GET requests,
// so URL + query params is sufficient to uniquely identify requests.
// Multiple almost simultaneous requests are common with healthy-checks
// when the backend is not responding fast enough.
// `currentRequestRefs` is the refcount of awaiters for the in-flight promise;
// the entry is removed only when the last awaiter resumes.
const currentRequests = new Map<string, Promise<Response>>();
const currentRequestRefs = new Map<string, number>();

export async function fetchWithETag(
	input: globalThis.Request | URL | string,
	init?: RequestInit,
): Promise<Response> {
	const url = input instanceof Request ? input.url : input instanceof URL ? input.href : input;
	const cachedEntry = cache.get(url);

	if (cachedEntry && new Date() < cachedEntry.expiresAt) {
		return new Response(cachedEntry.body, {
			status: 200,
			headers: {
				"X-Cache": "fetchWithETag HIT",
				"X-Cache-Expires": cachedEntry.expiresAt.toISOString(),
			},
		});
	}

	let response: Response;
	try {
		const ifNoneMatchHeader = cachedEntry?.ETag
			? {
					"If-None-Match": cachedEntry.ETag.replace(/--gzip$/, ""),
				}
			: {};
		const requestParams = {
			method: "GET",
			headers: (init
				? // eslint-disable-next-line @typescript-eslint/no-misused-spread
					{ ...init.headers, ...ifNoneMatchHeader }
				: ifNoneMatchHeader) as HeadersInit,
		};
		// Request mit ETag im If-None-Match Header.
		// Refcounted single-flight: every concurrent caller increments the count
		// (synchronously, before awaiting), so any caller arriving during the
		// in-flight window sees the existing entry and joins. The entry is
		// removed in the `finally` below once the last awaiter releases it.
		if (!currentRequests.has(url)) {
			// console.log(`New request for "${url}" initiated...`);
			currentRequests.set(url, fetch(input, requestParams));
		}
		currentRequestRefs.set(url, (currentRequestRefs.get(url) ?? 0) + 1);
		try {
			response = await currentRequests.get(url)!;
			// console.log(`Response for "${url}" received...`);
		} finally {
			const remaining = (currentRequestRefs.get(url) ?? 1) - 1;
			if (remaining <= 0) {
				currentRequestRefs.delete(url);
				currentRequests.delete(url);
			} else {
				currentRequestRefs.set(url, remaining);
			}
		}
	} catch (error) {
		if (cachedEntry) {
			console.warn("Fetch with ETag failed, returning cached version...", error);
			return new Response(cachedEntry.body, { status: 200 });
		} else {
			throw new Error(
				`Could not fetch and cache with ETag! ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// Save ETag from response header
	const currentETag = response.headers.get("ETag");
	// Get max-age from Cache-Control header, CoPilot suggested this implementation
	const maxAge = parseInt(
		response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] ?? "0",
		10,
	);

	// Set timeout to delete cached data after two times maxAge
	setTimeout(
		() => {
			deleteFromCacheIfExpired(url);
		},
		(maxAge > 0 ? maxAge : 5) * 2 * 1000,
	);

	if (response.status === 304) {
		if (cachedEntry) {
			cachedEntry.expiresAt = new Date();
			cachedEntry.expiresAt.setSeconds(
				cachedEntry.expiresAt.getSeconds() + (maxAge > 0 ? maxAge : 5),
			);
			return new Response(cachedEntry.body, { status: 200 });
		}
		throw new Error(`Cache error!`);
	} else if (response.ok) {
		if (currentETag) {
			// response body can't be typed at this point
			const expiresAt = new Date();
			expiresAt.setSeconds(expiresAt.getSeconds() + (maxAge > 0 ? maxAge : 5));
			const cacheEntry = {
				ETag: currentETag,
				body: new Uint8Array(await response.clone().arrayBuffer()),
				expiresAt,
			};
			// console.log(
			// 	`Caching response for "${url}" with ETag ${currentETag} until ${expiresAt.toISOString()}`,
			// );
			cache.set(url, cacheEntry);
		}
		// Return a fresh Response per awaiter. Under single-flight, multiple
		// callers receive the same `Response` object, and sharing the body
		// stream across them causes "Body has already been consumed" errors
		// downstream (e.g. Orval's generated `response.json()`).
		return response.clone();
	} else {
		return response.clone();
	}
}

function deleteFromCacheIfExpired(url: string) {
	const expiresAt = cache.get(url)?.expiresAt;
	if (!expiresAt) return;
	if (new Date() >= expiresAt) {
		// eslint-disable-next-line no-console
		console.info(`Cache for ${url} expired after ${expiresAt.toISOString()}, deleting...`);
		cache.delete(url);
	}
}

export function useApiClient() {
	const env = useRuntimeConfig();

	if (env.public.apiUser) {
		api = new Api<userPass>({
			baseApiParams: { secure: true },
			securityWorker: basicSecurityWorker,
			customFetch:
				typeof document === "undefined"
					? (...fetchParams: Parameters<typeof fetch>) => fetchWithETag(...fetchParams)
					: (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams),
		});
		api.setSecurityData({
			user: env.public.apiUser,
			pass: env.public.apiPass,
		});
	} else {
		api = new Api({
			customFetch:
				typeof document === "undefined"
					? (...fetchParams: Parameters<typeof fetch>) => fetchWithETag(...fetchParams)
					: (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams),
		});
	}

	if (import.meta.server && env.apiBaseUrl) {
		api.baseUrl = env.apiBaseUrl;
	} else if (env.public.apiBaseUrl) {
		api.baseUrl = env.public.apiBaseUrl;
	}

	return api;
}
