import { useQuery } from "@tanstack/vue-query";

import type { DataTypesEnum } from "@/types/global.ts";

interface DataWordParams {
	dataType: string;
	query: Ref<string>;
}

interface DataWordOptions {
	/** Milliseconds to wait after the last keystroke before requesting suggestions. */
	debounce?: number;
	/** Minimum number of entered characters before suggestions are requested. */
	minLength?: number;
	enabled?: MaybeRefOrGetter<boolean>;
}

export function useDataWords(params: DataWordParams, options: DataWordOptions = {}) {
	const { debounce = 300, minLength = 2, enabled = true } = options;
	const api = useApiClient();
	const debouncedQuery = refDebounced(params.query, debounce);

	return useQuery({
		enabled: computed(() => toValue(enabled) && debouncedQuery.value.length >= minLength),
		queryKey: ["get-data-words", params.dataType, debouncedQuery] as const,
		async queryFn() {
			const response = await api.vicav.getDataWords(
				{
					type: dataTypes[params.dataType as DataTypesEnum].collection.replace("vicav_", ""),
					query: debouncedQuery.value,
				},
				{
					headers: { accept: "application/json" },
				},
			);
			return response.data;
		},
	});
}
