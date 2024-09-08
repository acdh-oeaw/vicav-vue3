import { useQuery } from "@tanstack/vue-query";

import type { ExploreSamplesQueryParams } from "@/types/global.d";

import dataTypes from "../config/dataTypes";

export function useExploreSamplesResult(
	params: MaybeRef<Zod.infer<typeof ExploreSamplesQueryParams>>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-compare", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getCompare(
				{
					type: dataTypes[params.dataType]?.collection.replace("vicav_", ""),
					word: params.word,
					features: params.features,
					comment: params.comment,
					translation: params.translation,
					ids: params.ids,
					page: params.page,
				},
				{ headers: { accept: "application/xml" } },
			);
			return response.text();
		},
	});
}
