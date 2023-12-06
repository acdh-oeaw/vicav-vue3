import { useQuery } from "@tanstack/vue-query";

export function useBiblioTeiQuery(
	params: MaybeRef<{ query: string; xslt?: string }>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();
	const paramsRef = ref(params);
	console.log(params);
	paramsRef.value.xslt = "biblio_tei_01.xslt";

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-biblio-tei", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.vicav.getBiblioTei(params, {
				headers: { accept: "application/xml" },
			});
			return response.text();
		},
	});
}
