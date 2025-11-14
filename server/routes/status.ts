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
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		setResponseStatus(event, 503);
		return {
			status: 503,
			ETag: null,
			backendVersion: null,
			frontendVersion: env.public.currentGitSha,
			error: `Unable to fetch backend status. ${error instanceof Error ? error.message : String(error)}`,
			timestamp: new Date().toISOString(),
		};
	}
});
