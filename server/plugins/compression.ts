import { getRequestHeader, type H3Event, setResponseHeader } from "h3";
import type { RenderResponse } from "nitropack";

// in Node 24+ CompressionStream supports brotli, so we can use it.
type CompressionFormat = "brotli" | "deflate" | "deflate-raw" | "gzip";

// This is the main function of h3-compression. As it is the only thing we really use and the
// rest of the code contains surprises (br silently ignored) it is copied here.
function compressStream(
	event: H3Event,
	response: Partial<RenderResponse>,
	method: CompressionFormat,
) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const stream = new Response(response.body).body;
	setResponseHeader(
		event,
		"Content-Encoding",
		(method === "brotli" ? "br" : method) as unknown as string,
	);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore - CompressionStream in Node 24+ does understand brotli and this runs in Node only.
	response.body = stream?.pipeThrough(new CompressionStream(method));
}

export default defineNitroPlugin((nitro) => {
	nitro.hooks.hook("render:response", (response, { event }) => {
		const encoding = getRequestHeader(event, "accept-encoding");
		// The error page still has event.statusCode = 200 !?!
		if (event.context.matchedRoute?.path === "/__nuxt_error") return;
		if (encoding?.includes("gzip")) {
			//			console.log('Using GZIP compression')
			compressStream(event, response, "gzip");
		} else if (encoding?.includes("deflate")) {
			//			console.log('Using GZIP compression')
			compressStream(event, response, "deflate");
		}
		// CompressionStream in node 24+ does supports brotli. It is compute intensive and thus slow.
		else if (encoding?.includes("br")) {
			//console.log('Using br compression')
			compressStream(event, response, "brotli");
		}
	});
});
