import { Api } from "@/lib/api-client";

const api = new Api();

export function useApiClient() {
	const env = useRuntimeConfig();

	if (env.public.NUXT_PUBLIC_API_BASE_URL) {
		api.baseUrl = env.public.NUXT_PUBLIC_API_BASE_URL;
	}

	return api;
}
