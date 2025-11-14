import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
	const env = useRuntimeConfig();
	const api = useApiClient();
	try {
		const response = await api.vicav.getProject({ headers: { accept: "application/json" } });
		const backendData = response.data;
		setResponseStatus(event, response.status);
		return {
			status: response.status,
			ETag: backendData.ETag,
			backendVersion: backendData.projectConfig?.version?.backend,
			frontendVersion: env.public.currentGitSha,
			error: null,
			cacheInfo: response.headers.get("x-cache-expires")
				? { expiresAt: response.headers.get("x-cache-expires") }
				: null,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		if (error instanceof Error) {
			setResponseStatus(event, 503);
			return {
				status: 503,
				ETag: null,
				backendVersion: null,
				frontendVersion: env.public.currentGitSha,
				error: `Unable to fetch backend status. ${error.message}`,
				cacheInfo: null,
				timestamp: new Date().toISOString(),
			};
		} else if (error instanceof Response) {
			setResponseStatus(event, error.status);
			return {
				status: error.status,
				ETag: error.headers.get("ETag") ?? null,
				backendVersion: null,
				frontendVersion: env.public.currentGitSha,
				error: `Unable to fetch backend status. ${error.statusText}`,
				cacheInfo: null,
				timestamp: new Date().toISOString(),
			};
		}
	}
});
