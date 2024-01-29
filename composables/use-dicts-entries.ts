import { useQuery } from "@tanstack/vue-query";

import type { Dict } from "@/types/global.d";

const api = useApiClient();
export function useDictsEntries(
	params: {
		dictId: Zod.infer<typeof Dict>["id"];
		queryParams: Parameters<typeof api.restvle.getDictDictNameEntries>[1];
	},
	options?: { enabled?: boolean },
) {
	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-dicts-entries", params] as const,
		async queryFn({ queryKey: [, params] }) {
			if (!params.queryParams?.q) return null;
			try {
				const response = await api.restvle.getDictDictNameEntries(
					params.dictId,
					params.queryParams,
					{
						headers: { accept: "application/json" },
					},
				);
				return response.data;
			} catch (e) {
				if (e.status === null) {
					console.error(e);
					return null;
				}
				switch (e.status) {
					case 404: {
						return {
							total_items: "0",
						};
						break;
					}
					default: {
						break;
					}
				}
				console.error(e);
				return null;
			}
		},
	});
}
