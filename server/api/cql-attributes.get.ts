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
	const { corpname } = getQuery(event);
	// eslint-disable-next-line @typescript-eslint/no-base-to-string
	const noske: string = typeof corpname === "string" ? corpname : String(corpname);

	return $fetch<NoskeCorpInfo>(`${noske}/run.cgi/corp_info`, {
		query: {
			format: "json",
		},
	});
});
