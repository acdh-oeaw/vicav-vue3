import { useQuery } from "@tanstack/vue-query";

import type { TextId } from "@/types/global.d";

export function useFeatureById(
	params: MaybeRef<Zod.infer<typeof TextId>>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-feature-by-id", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getLingFeature(
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
