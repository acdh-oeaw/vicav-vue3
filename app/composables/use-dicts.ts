import { useQuery } from "@tanstack/vue-query";

export function useDicts(options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		retry: false,
		queryKey: ["get-dicts"] as const,
		async queryFn() {
			const response = await api.restvle.getDicts({}, { headers: { accept: "application/json" } });
			return response.data;
		},
	});
}
