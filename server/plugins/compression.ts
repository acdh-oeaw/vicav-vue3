// This is inspired by the main function of h3-compression: https://github.com/CodeDredd/h3-compression.
// The was extended in August 2026 with the help of AI (Claude Sonnet 5).
// The goal was to Buffer the compressed result and return that instead of compressing on the fly.

import { Blob } from "node:buffer";
import { type CompressionFormat, CompressionStream } from "node:stream/web";

import { getRequestHeader, type H3Event, setResponseHeader } from "h3";
import type { RenderResponse } from "nitropack";

// Cache of in-flight compressions, keyed by `${method}:${sha256(body)}`.
// Storing the promise (not just the resolved bytes) means concurrent requests
// for the same not-yet-cached body await the same compression work instead of
// each starting their own. Once resolved, the compressed bytes are persisted
// via Nitro's storage layer (see `compressStream`) so they survive beyond a
// single in-flight request.
const inFlight = new Map<string, Promise<Uint8Array>>();

async function sha256Hex(data: ArrayBuffer) {
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function compress(buffer: ArrayBuffer, method: CompressionFormat) {
	// The types are incompatible because the type script 5.9.3 typing does not
	// recognize brotli compression.
	const stream = new Blob([buffer])
		.stream()
		.pipeThrough(new CompressionStream(method)) as ReadableStream;
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

// The body is buffered fully so it can be hashed: if the same body was already
// compressed for a previous response, the cached compressed bytes are reused
// instead of running the (CPU-bound) compression again.
async function compressStream(
	event: H3Event,
	response: Partial<RenderResponse>,
	method: CompressionFormat,
) {
	const contentEncoding = method as unknown as string;
	setResponseHeader(
		event,
		"Content-Encoding",
		contentEncoding === "brotli" ? "br" : contentEncoding,
	);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const buffer = await new Response(response.body).arrayBuffer();
	const hash = await sha256Hex(buffer);
	const cacheKey = `compression:${method}:${hash}`;
	setResponseHeader(event, "ETag", hash.substring(0, 16));

	const storage = useStorage();

	const cached = await storage.getItemRaw<Uint8Array>(cacheKey);
	if (cached) {
		// eslint-disable-next-line require-atomic-updates -- `response` is unique per request, not shared across awaits.
		response.body = cached;
		return;
	}

	let compressed = inFlight.get(cacheKey);
	if (!compressed) {
		compressed = compress(buffer, method);
		inFlight.set(cacheKey, compressed);
		compressed
			.then((bytes) => storage.setItemRaw(cacheKey, bytes))
			.finally(() => {
				inFlight.delete(cacheKey);
			})
			.catch(() => {
				// Persisting the compressed bytes is a best-effort cache write;
				// the response below still gets the compressed body regardless.
			});
	}

	// eslint-disable-next-line require-atomic-updates -- `response` is unique per request, not shared across awaits.
	response.body = await compressed;
}

export default defineNitroPlugin((nitro) => {
	nitro.hooks.hook("render:response", async (response, { event }) => {
		const encoding = getRequestHeader(event, "accept-encoding");
		if (encoding?.includes("br")) {
			//			console.log('Using brotli compression')
			await compressStream(event, response, "brotli");
		} else if (encoding?.includes("gzip")) {
			//			console.log('Using GZIP compression')
			await compressStream(event, response, "gzip");
		} else if (encoding?.includes("deflate")) {
			//			console.log('Using deflate compression')
			await compressStream(event, response, "deflate");
		}
	});
});
