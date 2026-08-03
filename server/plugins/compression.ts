// This is inspired by the main function of h3-compression: https://github.com/CodeDredd/h3-compression.
// The was extended in August 2026 with the help of AI (Claude Sonnet 5).
// The goal was to Buffer the compressed result and return that instead of compressing on the fly.

import { Blob } from "node:buffer";
import { type CompressionFormat, CompressionStream } from "node:stream/web";

import { getRequestHeader, type H3Event, setResponseHeader } from "h3";

// Cache of in-flight compressions, keyed by `${method}:${sha256(body)}`.
// Storing the promise (not just the resolved bytes) means concurrent requests
// for the same not-yet-cached body await the same compression work instead of
// each starting their own. Once resolved, the compressed bytes are persisted
// via Nitro's storage layer (see `compressStream`) so they survive beyond a
// single in-flight request.
const inFlight = new Map<string, Promise<Uint8Array>>();

async function sha256Hex(data: Uint8Array<ArrayBuffer>) {
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function compress(buffer: Uint8Array<ArrayBuffer>, method: CompressionFormat) {
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
	buffer: Uint8Array<ArrayBuffer>,
	hash: string,
	method: CompressionFormat,
): Promise<Uint8Array | undefined | null> {
	const contentEncoding = method as unknown as string;
	setResponseHeader(
		event,
		"Content-Encoding",
		contentEncoding === "brotli" ? "br" : contentEncoding,
	);

	const cacheKey = `compression:${method}:${hash}`;

	const storage = useStorage();

	const cached = await storage.hasItem(cacheKey);
	if (cached) {
		return storage.getItemRaw<Uint8Array>(cacheKey);
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

	return compressed;
}

export default defineNitroPlugin((nitro) => {
	nitro.hooks.hook("render:response", async (response, { event }) => {
		const enc = new TextEncoder();
		const buffer = enc.encode(response.body as string);
		const hash = await sha256Hex(buffer);
		const etag = hash.substring(0, 16);
		const ifNoneMatch = getRequestHeader(event, "if-none-match");

		setResponseHeader(event, "ETag", etag);
		// The client already has this exact representation cached: skip
		// compression entirely and return an empty 304.
		if (ifNoneMatch === etag) {
			setResponseHeader(event, "ETag", etag);
			// eslint-disable-next-line require-atomic-updates -- `response` is unique per request, not shared across awaits.
			response.statusCode = 304;
			// eslint-disable-next-line require-atomic-updates -- `response` is unique per request, not shared across awaits.
			response.body = "";
			return;
		}
		const encoding = getRequestHeader(event, "accept-encoding");
		if (encoding?.includes("br")) {
			//			console.log('Using brotli compression')
			// eslint-disable-next-line require-atomic-updates -- `response` is unique per request, not shared across awaits.
			response.body = await compressStream(event, buffer, hash, "brotli");
		} else if (encoding?.includes("gzip")) {
			//			console.log('Using GZIP compression')
			// eslint-disable-next-line require-atomic-updates -- `response` is unique per request, not shared across awaits.
			response.body = await compressStream(event, buffer, hash, "gzip");
		} else if (encoding?.includes("deflate")) {
			//			console.log('Using deflate compression')
			// eslint-disable-next-line require-atomic-updates -- `response` is unique per request, not shared across awaits.
			response.body = await compressStream(event, buffer, hash, "deflate");
		}
	});
});
