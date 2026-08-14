// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import type { Div, U } from "@/lib/api-client";

import { getCorpusRowText, renderCorpusTokenText } from "./corpus-transcription.ts";

describe("corpus transcription", () => {
	it("recursively copies compound text without annotation artifacts", () => {
		const compound = {
			seg: {
				"@lemmaRef": "dict:DShaAr.wakt_in_000",
				pos: "compound",
				$$: [
					{ w: { $: "wakt", "@join": "right", "@lemmaRef": "dict:wakt" } },
					{ w: { $: "in", pos: "prep" } },
				],
			},
		} as unknown as U["$$"][number];

		expect(renderCorpusTokenText(compound)).toBe("waktin ");
	});

	it("preserves utterance separation and normalizes display spacing", () => {
		const div = {
			u: {
				$$: [{ w: { $: "wakt" } }, { w: { $: "in" } }],
			},
			us: [{ $$: [{ gap: { "@rendition": "rend:ellipsisInSquareBrackets" } }] }],
		} as unknown as Pick<Div, "u" | "us">;

		const getUtterances = (block: Pick<Div, "u" | "us">): Array<U> => {
			return [block.u, ...(block.us ?? [])].filter((utterance) => utterance !== undefined);
		};

		expect(getCorpusRowText(div, getUtterances)).toBe("wakt in\n[...]");
	});
});
