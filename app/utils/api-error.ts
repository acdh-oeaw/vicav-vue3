export class RFC7807ProblemError extends Error {
	RFC7807Problem: Document;

	constructor(RFC7807Problem: Document, message: string | undefined) {
		super(message);
		this.name = "RFC7807ProblemError";
		this.RFC7807Problem = RFC7807Problem;
	}
}

// Client-only: convert a rejected API Response (an XML problem report) into a
// structured error so the toast can show its <title>. The guard makes this a
// no-op on the Node/SSR runtime, where DOMParser does not exist.
export async function withProblemError(promise: Promise<Response>): Promise<Response> {
	try {
		return await promise;
	} catch (error) {
		if (error instanceof Response && typeof DOMParser !== "undefined") {
			const doc = new DOMParser().parseFromString(await error.text(), "application/xml");
			const title = doc.querySelector("title")?.textContent;
			if (title) {
				throw new RFC7807ProblemError(doc, title);
			}
		}
		throw error;
	}
}

// Toast description that works for both converted errors and raw Response rejections.
export function describeApiError(error: unknown): string {
	if (error instanceof Response) {
		return `HTTP ${String(error.status)}${error.statusText ? ` ${error.statusText}` : ""}`;
	} else if (error instanceof RFC7807ProblemError) {
		const mainMessage = `Api Problem: ${error.RFC7807Problem.querySelector("title")?.textContent ?? "NO TITLE"}:
${error.RFC7807Problem.querySelector("detail")?.textContent ?? "NO DETAILS"}`;
		console.error(`${mainMessage}
${error.RFC7807Problem.querySelector("trace")?.textContent ?? "NO TRACE"}`)
		return mainMessage
	}
	return error instanceof Error ? error.message : String(error);
}
