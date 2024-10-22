import { Api, type RequestParams } from "@/lib/api-client";

interface userPass {
	user: string;
	pass: string;
}

let api = new Api<userPass>();

function basicSecurityWorker(securityData: userPass | null): RequestParams | undefined {
	if (securityData) {
		return {
			headers: { authorization: "Basic " + btoa(securityData.user + ":" + securityData.pass) },
		};
	}
	return undefined;
}

const cache: Map<string, Record<string, unknown>> = new Map<string, Record<string, unknown>>();

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
		headers: (init ? { ...init.headers, ...ifNoneMatchHeader } : ifNoneMatchHeader) as HeadersInit,
	};
	// Request mit ETag im If-None-Match Header
	const response = await fetch(input, requestParams);

	// ETag aus dem Header speichern
	const currentETag = response.headers.get("ETag");

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
		}
		return response;
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

	if (env.public.apiBaseUrl) {
		api.baseUrl = env.public.apiBaseUrl;
	}

	return api;
}
