// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { describeApiError, RFC7807ProblemError, withProblemError } from "./api-error.ts";

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
  <trace>/app/vicav.xqm, 492/29
- /app/vicav.xqm, 472/38
- /app/api-problem.xqm, 41/26</trace>
</problem>`;

function problemResponse(title?: string): Response {
	return new Response(problemBody(title), {
		status: 404,
		statusText: "Not Found",
		headers: { "content-type": "application/xml" },
	});
}

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
});
