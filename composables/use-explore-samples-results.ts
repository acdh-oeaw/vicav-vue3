import { useQuery } from "@tanstack/vue-query";

import type { ExploreSamplesQueryParams } from "@/types/global.d";

export function useExploreSamplesResult(
	params: MaybeRef<Zod.infer<typeof ExploreSamplesQueryParams>>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-explore-samples", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getExploreSamples(
				{
					word: params.word,
					person: params.person,
				},
				{ headers: { accept: "application/xml" } },
			);
			return response.text();
		},
	});
}
