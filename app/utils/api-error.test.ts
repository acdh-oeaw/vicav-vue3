// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { describeApiError, RFC7807ProblemError, withProblemError } from "./api-error.ts";

const traceText = `/app/vicav.xqm, 492/29
- /app/vicav.xqm, 472/38
- /app/api-problem.xqm, 41/26`;

const problemBody = (title?: string) =>
	`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/css" href="problem.css"?>
<problem xmlns="urn:ietf:rfc:7807">
  <type>https://tools.ietf.org/html/rfc7231#section-6</type>
${
	title
		? `
	<title>${title}</title>
`
		: ""
}
  <detail>Something went wrong</detail>
  <instance>https://tools.ietf.org/html/rfc7231#section-6.5.4</instance>
  <status>404</status>
  <trace>${traceText}</trace>
</problem>`;

function problemResponse(title?: string): Response {
	return new Response(problemBody(title), {
		status: 404,
		statusText: "Not Found",
		headers: { "content-type": "application/xml" },
	});
}

// A problem document with optional parts, for testing the describeApiError fallbacks.
function partialProblemBody(
	parts: { title?: string; detail?: boolean; trace?: boolean } = {},
): string {
	const elements: Array<string> = [];
	if (parts.title !== undefined) {
		elements.push(`<title>${parts.title}</title>`);
	}
	if (parts.detail ?? true) {
		elements.push("<detail>Something went wrong</detail>");
	}
	if (parts.trace ?? true) {
		elements.push(`<trace>${traceText}</trace>`);
	}
	return `<?xml version="1.0" encoding="utf-8"?>
<problem xmlns="urn:ietf:rfc:7807">
${elements.join("\n")}
</problem>`;
}

function makeProblemError(body: string, message?: string): RFC7807ProblemError {
	return new RFC7807ProblemError(new DOMParser().parseFromString(body, "application/xml"), message);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("withProblemError", () => {
	it("converts a rejected Response with a problem <title> into an RFC7807ProblemError", async () => {
		let caught: unknown = null;
		try {
			// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- rejecting with a Response is the point
			await withProblemError(Promise.reject(problemResponse("Text not found")));
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(RFC7807ProblemError);
		const problemError = caught as RFC7807ProblemError;
		expect(problemError.name).toBe("RFC7807ProblemError");
		expect(problemError.message).toBe("Text not found");
		expect(problemError.RFC7807Problem.querySelector("title")?.textContent).toBe("Text not found");
		expect(problemError.RFC7807Problem.querySelector("detail")?.textContent).toBe(
			"Something went wrong",
		);
	});

	it("rejects with the original Response when the body has no <title>", async () => {
		const response = problemResponse();
		// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- rejecting with a Response is the point
		await expect(withProblemError(Promise.reject(response))).rejects.toBe(response);
	});

	it("rethrows non-Response rejections unchanged", async () => {
		const error = new Error("boom");
		await expect(withProblemError(Promise.reject(error))).rejects.toBe(error);
	});

	it("resolves a successful Response unchanged", async () => {
		const response = new Response(problemBody("ok"), {
			status: 200,
			statusText: "OK",
			headers: { "content-type": "application/xml" },
		});
		await expect(withProblemError(Promise.resolve(response))).resolves.toBe(response);
	});
});

describe("describeApiError", () => {
	it("describes a Response with its status and statusText", () => {
		expect(describeApiError(new Response(null, { status: 404, statusText: "Not Found" }))).toBe(
			"HTTP 404 Not Found",
		);
	});

	it("describes a Response without statusText with its status only", () => {
		expect(describeApiError(new Response(null, { status: 500 }))).toBe("HTTP 500");
	});

	it("uses the message of an Error", () => {
		expect(describeApiError(new Error("boom"))).toBe("boom");
	});

	it("stringifies other values", () => {
		expect(describeApiError("oops")).toBe("oops");
		expect(describeApiError(42)).toBe("42");
	});

	it("returns title and detail of an RFC7807ProblemError and logs the trace to console.error", () => {
		const mainMessage = `Api Problem: Text not found:
Something went wrong`;
		const error = makeProblemError(problemBody("Text not found"), "Text not found");
		const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		expect(describeApiError(error)).toBe(mainMessage);
		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledWith(
			`${mainMessage}
${traceText}`,
		);
	});

	it("uses the NO TITLE placeholder when the problem document has no <title>", () => {
		const error = makeProblemError(partialProblemBody());
		const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		expect(describeApiError(error)).toBe(`Api Problem: NO TITLE:
Something went wrong`);
		expect(logSpy).toHaveBeenCalledWith(
			`Api Problem: NO TITLE:
Something went wrong
${traceText}`,
		);
	});

	it("uses the NO DETAILS placeholder when the problem document has no <detail>", () => {
		const error = makeProblemError(partialProblemBody({ title: "Text not found", detail: false }));
		const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		expect(describeApiError(error)).toBe(`Api Problem: Text not found:
NO DETAILS`);
		expect(logSpy).toHaveBeenCalledWith(
			`Api Problem: Text not found:
NO DETAILS
${traceText}`,
		);
	});

	it("uses the NO TRACE placeholder in the console log when the problem document has no <trace>", () => {
		const error = makeProblemError(partialProblemBody({ title: "Text not found", trace: false }));
		const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		expect(describeApiError(error)).toBe(`Api Problem: Text not found:
Something went wrong`);
		expect(logSpy).toHaveBeenCalledWith(
			`Api Problem: Text not found:
Something went wrong
NO TRACE`,
		);
	});

	it("describes a Response converted by withProblemError with the problem's title, detail and trace", async () => {
		const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		let caught: unknown = null;
		try {
			// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- rejecting with a Response is the point
			await withProblemError(Promise.reject(problemResponse("Text not found")));
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(RFC7807ProblemError);
		expect(describeApiError(caught)).toBe(`Api Problem: Text not found:
Something went wrong`);
		expect(logSpy).toHaveBeenCalledWith(
			`Api Problem: Text not found:
Something went wrong
${traceText}`,
		);
	});
});
