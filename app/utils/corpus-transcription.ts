import type { Div, U } from "@/lib/api-client";

export function renderCorpusTokenText(token: U["$$"][number]): string {
	if (token.w) {
		let renderedText = token.w.$;
		renderedText +=
			token.w["@join"] === "right" && token.w["@rendition"] === "rend:dashAfter" ? "-" : "";
		renderedText += token.w["@rendition"] === "rend:ellipsisAfter" ? "..." : "";
		renderedText +=
			token.w["@join"] === "right" && token.w["@rendition"] === "rend:withBowBelow" ? "_" : "";
		renderedText += token.w["@join"] === "right" ? "" : " ";
		return renderedText;
	}

	if (token.pc) return `${token.pc.$} `;

	if (token.gap) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		return token.gap["@rendition"] === "rend:ellipsisInSquareBrackets" ? "[...] " : "";
	}

	if (token.seg) return token.seg.$$.map(renderCorpusTokenText).join("");

	return "";
}

export function getCorpusRowText(
	div: Pick<Div, "u" | "us">,
	getUtterances: (div: Pick<Div, "u" | "us">) => Array<U>,
): string {
	return getUtterances(div)
		.map((utterance) =>
			utterance.$$.map(renderCorpusTokenText).join("").replace(/\s+/g, " ").trim(),
		)
		.filter(Boolean)
		.join("\n");
}
