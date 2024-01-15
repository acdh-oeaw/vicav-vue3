import { useQuery } from "@tanstack/vue-query";

import type { BibliographyEntriesSchema } from "@/types/global.d";

export function useBiblioTeiQuery(
	params: MaybeRef<Zod.infer<typeof BibliographyEntriesSchema>["params"]>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();
	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-biblio-tei", params] as const,
		async queryFn({ queryKey: [, params] }) {
			if (params.queryString === "") return "";
			const apiParams: { query: string; xslt?: string } = {
				query: params.queryString,
			};
			if (typeof params.xslt !== "undefined") apiParams.xslt = params.xslt;
			const response = await api.vicav.getBiblioTei(apiParams, {
				headers: { accept: "application/xml" },
			});
			return response.text();
		},
	});
}
