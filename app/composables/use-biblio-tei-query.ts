import { useQuery } from "@tanstack/vue-query";
import type Zod from "zod";

import type { BibliographyEntriesSchema } from "@/types/global.ts";

const biblioEntrySelector = [
	".dvBiblBlock",
	".dvAuthor",
	".dvBibArticle",
	".dvBibBook",
	".dvBibBookSection",
	".dvThesis",
].join(",");

export interface BiblioTeiQueryResult {
	stats: string;
	html: string;
	hasResults: boolean;
}

export function parseBiblioTeiResponse(text: string): BiblioTeiQueryResult {
	const doc = new DOMParser().parseFromString(text, "text/html");
	const stats = doc.querySelector("div.dvStats");
	const hasResults = doc.querySelector(biblioEntrySelector) != null;

	stats?.parentElement?.removeChild(stats);

	if (!hasResults) {
		return {
			stats: stats == null ? "0 results" : stats.textContent.trim(),
			html: "",
			hasResults: false,
		};
	}

	const serializer = new XMLSerializer();

	return {
		stats: stats == null ? "" : stats.textContent.trim(),
		html: serializer.serializeToString(doc),
		hasResults: true,
	};
}

export function useBiblioTeiQuery(
	params: MaybeRef<Zod.infer<typeof BibliographyEntriesSchema>["params"]>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();
	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-biblio-tei", params] as const,
		async queryFn({ queryKey: [, params] }) {
			if (params.queryString === "") return null;
			const apiParams: { query: string; xslt?: string } = {
				query: params.queryString,
			};
			if (typeof params.xslt !== "undefined") apiParams.xslt = params.xslt;
			const response = await api.vicav.getBiblioTei(apiParams, {
				headers: { accept: "application/xml" },
			});
			const text = await response.text();
			return parseBiblioTeiResponse(text);
		},
	});
}
