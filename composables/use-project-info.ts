import { useQuery } from "@tanstack/vue-query";

export function useProjectInfo(options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-project-info"] as const,
		async queryFn() {
			const response = await api.vicav.getProject({ headers: { accept: "application/json" } });
			return response.data;
		},
	});
}
