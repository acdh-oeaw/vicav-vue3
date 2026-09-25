import { useQuery } from "@tanstack/vue-query";

import { prepareProject } from "@/lib/project/prepare-project.ts";
import type { ProjectResponse } from "@/types/project.ts";

export function useProjectInfo(options?: { enabled?: boolean }) {
	const api = useApiClient();
	const config = useRuntimeConfig();

	return useQuery({
		enabled: options?.enabled,
		retry: false,
		structuralSharing: false,
		queryKey: ["get-project-info"] as const,
		async queryFn() {
			const response = await api.vicav.getProject({ headers: { accept: "application/json" } });
			return (
				await prepareProject(response.data, api.baseUrl, {
					authenticated: Boolean(config.public.apiUser),
				})
			).response as ProjectResponse;
		},
	});
}
