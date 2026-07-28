// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import {
	extractCorpusAnnotations,
	getDictionaryEntryId,
	useCorpusAnnotationAvailability,
} from "./use-corpus-annotation-availability.ts";

const {
	hasLemmaAnnotation,
	hasLemmaAnnotations,
	hasLinguisticAnnotation,
	hasLinguisticAnnotations,
} = useCorpusAnnotationAvailability();

type AnnotationToken = Parameters<typeof hasLemmaAnnotation>[0];
type AnnotationBlocks = Parameters<typeof hasLemmaAnnotations>[0];

function token(value: unknown): AnnotationToken {
	return value as AnnotationToken;
}

function blocks(...tokens: Array<unknown>): AnnotationBlocks {
	return [{ u: { $$: tokens } }] as AnnotationBlocks;
}

describe("corpus annotation extraction", () => {
	it("separates lemma and linguistic annotations", () => {
		expect(
			extractCorpusAnnotations({
				"@lemmaRef": "dict:DShaAr.wakt_in_000",
				"@msd": "compound",
				pos: "prep",
				synRoots: ["w-q-t", { $: "ʔ-n" }],
				diaRoot: "w-q-t",
			}),
		).toEqual({
			lemmaRef: "dict:DShaAr.wakt_in_000",
			linguistic: [
				{ label: "POS", values: ["prep"] },
				{ label: "MSD", values: ["compound"] },
				{ label: "Syntactic root", values: ["w-q-t", "ʔ-n"] },
				{ label: "Diachronic root", values: ["w-q-t"] },
			],
		});
	});

	it("normalizes only the dict namespace prefix", () => {
		expect(getDictionaryEntryId("dict:DShaAr.wakt_in_000")).toBe("DShaAr.wakt_in_000");
		expect(getDictionaryEntryId("DShaAr.dict:wakt_in_000")).toBe("DShaAr.dict:wakt_in_000");
	});
});

describe("corpus annotation availability", () => {
	it("detects independent word annotations", () => {
		expect(hasLemmaAnnotation(token({ w: { $: "wakt", "@lemmaRef": "dict:wakt" } }))).toBe(true);
		expect(hasLinguisticAnnotation(token({ w: { $: "wakt", "@lemmaRef": "dict:wakt" } }))).toBe(
			false,
		);
		expect(hasLinguisticAnnotation(token({ w: { $: "wakt", pos: "noun" } }))).toBe(true);
	});

	it("detects segment-level annotations without requiring annotated words", () => {
		const segment = token({
			seg: {
				"@lemmaRef": "dict:wakt_in",
				pos: "compound",
				$$: [{ w: { $: "wakt" } }, { w: { $: "in" } }],
			},
		});

		expect(hasLemmaAnnotation(segment)).toBe(true);
		expect(hasLinguisticAnnotation(segment)).toBe(true);
	});

	it("recurses through nested segments and recognizes roots-only payloads", () => {
		const nested = token({
			seg: {
				$$: [
					{
						seg: {
							$$: [{ w: { $: "wakt", synRoots: ["w-q-t"] } }],
						},
					},
				],
			},
		});

		expect(hasLinguisticAnnotation(nested)).toBe(true);
	});

	it("keeps block-level capabilities independent and ignores empty fields", () => {
		const annotationBlocks = blocks(
			{ w: { $: "plain", "@lemmaRef": "" } },
			{ seg: { diaRoots: [], $$: [{ w: { $: "word", "@msd": "verb" } }] } },
		);

		expect(hasLemmaAnnotations(annotationBlocks)).toBe(false);
		expect(hasLinguisticAnnotations(annotationBlocks)).toBe(true);
		expect(hasLinguisticAnnotations(blocks({ seg: { $$: [{ w: { $: "plain" } }] } }))).toBe(false);
	});
});
