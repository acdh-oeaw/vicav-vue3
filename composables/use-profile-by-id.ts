import { useQuery } from "@tanstack/vue-query";
import type { z } from "zod";

import type { TextId } from "@/types/global.d";

export function useProfileById(
	params: MaybeRef<z.infer<typeof TextId>>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-profile-by-id", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getProfile(
				{
					id: params.textId,
				},
				{
					headers: { accept: "application/xml" },
				},
			);
			return response.text();
		},
	});
}
