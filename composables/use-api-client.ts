import { Api } from "@/lib/api-client";

const api = new Api();

export function useApiClient() {
	const env = useRuntimeConfig();

	if (env.public.apiBaseUrl) {
		api.baseUrl = env.public.apiBaseUrl;
	}

	return api;
}
