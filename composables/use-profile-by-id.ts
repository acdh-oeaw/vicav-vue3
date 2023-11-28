import { useQuery } from "@tanstack/vue-query";

export function useProfileById(params: MaybeRef<{ id: string }>, options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-profile-by-id", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getProfile(params, {
				headers: { accept: "application/xml" },
			});
			return response.text();
		},
	});
}
