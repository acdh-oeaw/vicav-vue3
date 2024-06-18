import { getRequestHeader, type H3Event, setResponseHeader } from "h3";
import type { RenderResponse } from "nitropack";

// This is the main function of h3-compression. As it is the only thing we really use and the
// rest of the code contains surprises (br silently ignored) it is copied here.
function compressStream(
	event: H3Event,
	response: Partial<RenderResponse>,
	method: CompressionFormat,
) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const stream = new Response(response.body).body;
	setResponseHeader(event, "Content-Encoding", method as unknown as string);
	response.body = stream?.pipeThrough(new CompressionStream(method));
}

export default defineNitroPlugin((nitro) => {
	nitro.hooks.hook("render:response", (response, { event }) => {
		const encoding = getRequestHeader(event, "accept-encoding");
		// CompressionStream does not support brotli yet!
		// if (encoding?.includes("br")) {
		// 	console.log('Using br compression')
		// 	compressStream(event, response, 'br');
		// }
		if (encoding?.includes("gzip")) {
			//			console.log('Using GZIP compression')
			compressStream(event, response, "gzip");
		} else if (encoding?.includes("deflate")) {
			//			console.log('Using GZIP compression')
			compressStream(event, response, "deflate");
		}
	});
});
