import { useQuery } from "@tanstack/vue-query";
import type Zod from "zod";

import type { TextId } from "@/types/global.d";

export function useTextById(
	params: MaybeRef<Zod.infer<typeof TextId>>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-text-by-id", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getText(
				{ id: params.textId },
				{ headers: { accept: "application/xml" } },
			);
			return response.text();
		},
	});
}
