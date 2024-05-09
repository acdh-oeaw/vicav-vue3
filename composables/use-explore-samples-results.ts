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
		queryKey: ["get-explore-samples", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getExploreSamples(
				{
					type: dataTypes[params.dataType]?.collection.replace("vicav_", ""),
					word: params.word,
					feature: params.feature,
					comment: params.comment,
					translation: params.translation,
					person: params.person,
					xslt: dataTypes[params.dataType]?.explore_xslt,
				},
				{ headers: { accept: "application/xml" } },
			);
			return response.text();
		},
	});
}
