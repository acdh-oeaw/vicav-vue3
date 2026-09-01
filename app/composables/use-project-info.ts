import { useQuery } from "@tanstack/vue-query";

export function useProjectInfo(options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		retry: false,
		structuralSharing: false,
		queryKey: ["get-project-info"] as const,
		async queryFn() {
			const response = await api.vicav.getProject({ headers: { accept: "application/json" } });
			return response.data;
		},
	});
}
