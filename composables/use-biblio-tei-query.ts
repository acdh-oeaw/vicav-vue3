import { useQuery } from "@tanstack/vue-query";

export function useBiblioTeiQuery(
	params: MaybeRef<BibliographyEntriesWindowItem["params"]>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();
	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-biblio-tei", params] as const,
		async queryFn({ queryKey: [, params] }) {
			if (params.queryString === "") return "";
			const apiParams = {
				query: params.queryString,
			} as BibliographyEntriesWindowItem["params"];
			if (typeof params.xslt !== "undefined") apiParams.xslt = params.xslt;
			const response = await api.vicav.getBiblioTei(apiParams, {
				headers: { accept: "application/xml" },
			});
			return response.text();
		},
	});
}
