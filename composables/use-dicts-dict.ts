import { useQuery } from "@tanstack/vue-query";

import type { Dict } from "@/types/global.d";

export function useDictsDict(
	params: { id: Zod.infer<typeof Dict>["id"] },
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-dicts", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.restvle.getDictDictName(params.id, {
				headers: { accept: "application/json" },
			});
			return response.data;
		},
	});
}
