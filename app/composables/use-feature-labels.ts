import { useQuery } from "@tanstack/vue-query";

export function useFeatureLabels(options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-feature-labels"] as const,
		async queryFn() {
			const response = await api.vicav.getFeatureLabels({
				headers: { accept: "application/json" },
			});
			return response.data;
		},
	});
}
