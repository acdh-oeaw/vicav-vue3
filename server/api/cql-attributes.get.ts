import { defineEventHandler, getQuery } from "h3";

/** Subset of NoSketch Engine's `corp_info` response that we expose to the client. */
interface NoskeCorpInfo {
	name?: string;
	attributes?: Array<{ name: string; label?: string; dynamic?: string; fromattr?: string }>;
	error?: string;
}

// Server-side proxy for the NoSketch Engine `corp_info` API. The NoSketch instance does not
// send CORS headers, so the browser cannot call it directly — we fetch it here (server-to-server)
// and return the JSON to the client.
export default defineEventHandler(async (event): Promise<NoskeCorpInfo> => {
	const env = useRuntimeConfig();
	const { corpname } = getQuery(event);

	return $fetch<NoskeCorpInfo>(`${env.noskeBaseUrl}/run.cgi/corp_info`, {
		query: {
			corpname: typeof corpname === "string" && corpname ? corpname : env.noskeCorpus,
			format: "json",
		},
	});
});
