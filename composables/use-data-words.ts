import { useQuery } from "@tanstack/vue-query";

interface DataWordParams {
	dataType: string;
}

export function useDataWords(params: DataWordParams, options?: { enabled?: boolean }) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-data-words", params] as const,
		async queryFn() {
			const response = await api.vicav.getDataWords(
				{
					type: dataTypes[params.dataType]?.collection.replace("vicav_", ""),
				},
				{
					headers: { accept: "application/json" },
				},
			);
			return response.data;
		},
	});
}
