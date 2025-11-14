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

// cache stores for each URL a mapping of ETag to response body
const cache = new Map<string, Record<string, unknown>>();
const expires = new Map<string, Record<string, Date>>();

async function fetchWithETag(
	input: globalThis.Request | URL | string,
	init?: RequestInit,
): Promise<Response> {
	const url = input instanceof Request ? input.url : input instanceof URL ? input.href : input;
	const cachedETag = cache.get(url);
	const ifNoneMatchHeader = cachedETag
		? {
				"If-None-Match": Object.keys(cachedETag)[0]?.replace(/--gzip$/, ""),
			}
		: {};
	const requestParams = {
		method: "GET",
		// eslint-disable-next-line @typescript-eslint/no-misused-spread
		headers: (init ? { ...init.headers, ...ifNoneMatchHeader } : ifNoneMatchHeader) as HeadersInit,
	};

	let response: Response;
	try {
		// Request mit ETag im If-None-Match Header
		response = await fetch(input, requestParams);
	} catch (error) {
		console.warn("Fetch with ETag failed, trying to return cached version...", error);
		const body = cache.get(url);
		if (body && Object.keys(body).length >= 1) {
			return new Response(JSON.stringify(Object.values(body)[0]), { status: 200 });
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

	if (response.status === 304) {
		if (cachedETag && Object.keys(cachedETag).length === 1) {
			const body = Object.values(cachedETag)[0];
			if (body) return new Response(JSON.stringify(body), { status: 200 });
		}
		throw new Error(`Cache error!`);
	} else if (response.ok) {
		if (currentETag) {
			// response body can't be typed at this point
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			cache.set(url, { [currentETag]: await response.clone().json() });
			if (maxAge > 0) {
				// CoPilot suggested this part
				const expireDate = new Date();
				expireDate.setSeconds(expireDate.getSeconds() + maxAge);
				expires.set(url, { [currentETag]: expireDate });
				// Set timeout to delete cache after maxAge
				setTimeout(() => {
					// eslint-disable-next-line no-console
					console.info(`Cache for ${url} expired after ${maxAge.toString()} seconds, deleting...`);
					const exp = expires.get(url);
					if (exp && Object.values(exp)[0] && new Date() >= Object.values(exp)[0]!) {
						cache.delete(url);
						expires.delete(url);
					}
				}, maxAge * 1000);
			}
		}
		return new Response(JSON.stringify(await response.clone().json()), { status: 200 });
	} else {
		throw new Error(`HTTP error! Status: ${response.status.toString()}`);
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

	if (env.apiBaseUrl) {
		api.baseUrl = env.apiBaseUrl;
	} else if (env.public.apiBaseUrl) {
		api.baseUrl = env.public.apiBaseUrl;
	}

	return api;
}
