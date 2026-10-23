import { defineEventHandler } from "h3";

import { prepareProject } from "@/lib/project/prepare-project.ts";

export default defineEventHandler(async (event) => {
	const env = useRuntimeConfig();
	const api = useApiClient();
	try {
		const response = await api.vicav.getProject({ headers: { accept: "application/json" } });
		const backendData = response.data;
		const preparedProject = await prepareProject(backendData, api.baseUrl, {
			authenticated: Boolean(env.public.apiUser),
		});
		setResponseStatus(event, response.status);
		return {
			status: response.status,
			ETag: backendData.ETag,
			backendVersion: backendData.projectConfig?.version?.backend,
			frontendVersion: env.public.currentGitSha,
			validationErrors: preparedProject.response.projectConfig?._validationErrors ?? [],
			error: null,
			cacheInfo: response.headers.get("x-cache-expires")
				? { expiresAt: response.headers.get("x-cache-expires") }
				: null,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		if (error instanceof Response) {
			setResponseStatus(event, error.status);
			return {
				status: error.status,
				ETag: error.headers.get("ETag") ?? null,
				backendVersion: null,
				frontendVersion: env.public.currentGitSha,
				validationErrors: [],
				error: `Unable to fetch backend status. ${error.statusText}`,
				cacheInfo: null,
				timestamp: new Date().toISOString(),
			};
		} else {
			setResponseStatus(event, 503);
			return {
				status: 503,
				ETag: null,
				backendVersion: null,
				frontendVersion: env.public.currentGitSha,
				validationErrors: [],
				error: `Unable to fetch backend status. ${error instanceof Error ? error.message : String(error)}`,
				cacheInfo: null,
				timestamp: new Date().toISOString(),
			};
		}
	}
});
