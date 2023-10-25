import { useQuery } from "@tanstack/vue-query";

export function useTextById(params: MaybeRef<{ id: string }>, options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-text-by-id", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getText(params, { headers: { accept: "application/xml" } });
			return response.text();
		},
	});
}
