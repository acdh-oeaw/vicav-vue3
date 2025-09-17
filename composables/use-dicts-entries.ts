import { useQuery } from "@tanstack/vue-query";
import type Zod from "zod";

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
			if (!params.queryParams?.q && !params.queryParams?.id && !params.queryParams?.ids)
				return null;
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
				/*
				TODO TypeScript defaults errors to unknown, so this won't work without manual type assertion
				see https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables
				if (e.status === null) {
					console.error(e);
					return null;
				}
				 TODO this won't work like this, because the return type RestVLEEntries
				   implies a different shape
				   either complete the shape here or move error handling to the component
				   using the "isError" return value
				switch (e.status) {
					case 404: {
						return {
							total_items: "0",
						};
					}
					default: {
						break;
					}
				}
				*/
				console.error(e);
				throw e;
			}
		},
	});
}
