import type { Div, U } from "@/lib/api-client";

type CorpusAnnotationBlock = Pick<Div, "Translation_spanGrp" | "u" | "us">;
type CorpusUtteranceToken = U["$$"][number];

export interface CorpusAnnotationTarget {
	"@lemmaRef"?: string;
	"@msd"?: string;
	pos?: string;
}

export interface CorpusLinguisticAnnotation {
	label: "POS" | "MSD";
	values: Array<string>;
}

export interface CorpusAnnotations {
	lemmaRef?: string;
	linguistic: Array<CorpusLinguisticAnnotation>;
}

function createLinguisticAnnotation(
	label: CorpusLinguisticAnnotation["label"],
	value: string | undefined,
): CorpusLinguisticAnnotation | undefined {
	return value?.trim() ? { label, values: [value] } : undefined;
}

export function extractCorpusAnnotations(
	target: CorpusAnnotationTarget | undefined,
): CorpusAnnotations {
	if (target == null) return { linguistic: [] };

	const linguistic = [
		createLinguisticAnnotation("POS", target.pos),
		createLinguisticAnnotation("MSD", target["@msd"]),
	].filter((annotation) => annotation !== undefined);

	return {
		lemmaRef:
			typeof target["@lemmaRef"] === "string" && target["@lemmaRef"].trim() !== ""
				? target["@lemmaRef"]
				: undefined,
		linguistic,
	};
}

export function getDictionaryEntryId(lemmaRef: string): string {
	return lemmaRef.replace(/^dict:/, "");
}

export function useCorpusAnnotationAvailability() {
	function getUtterances(div: Pick<Div, "u" | "us">): Array<U> {
		return [div.u, ...(div.us ?? [])].filter((u) => u !== undefined);
	}

	function tokenAndDescendantsHaveAnnotation(
		token: CorpusUtteranceToken,
		predicate: (annotations: CorpusAnnotations) => boolean,
	): boolean {
		if (token.w && predicate(extractCorpusAnnotations(token.w))) return true;

		if (token.seg) {
			if (predicate(extractCorpusAnnotations(token.seg))) return true;
			return token.seg.$$.some((child) => tokenAndDescendantsHaveAnnotation(child, predicate));
		}

		return false;
	}

	function hasLemmaAnnotation(token: CorpusUtteranceToken): boolean {
		return tokenAndDescendantsHaveAnnotation(token, (annotations) => annotations.lemmaRef != null);
	}

	function hasLinguisticAnnotation(token: CorpusUtteranceToken): boolean {
		return tokenAndDescendantsHaveAnnotation(
			token,
			(annotations) => annotations.linguistic.length > 0,
		);
	}

	function blocksHaveAnnotation(
		blocks: Array<CorpusAnnotationBlock>,
		predicate: (token: CorpusUtteranceToken) => boolean,
	): boolean {
		return blocks.some((block) =>
			getUtterances(block).some((utterance) => utterance.$$.some(predicate)),
		);
	}

	function hasLemmaAnnotations(blocks: Array<CorpusAnnotationBlock>): boolean {
		return blocksHaveAnnotation(blocks, hasLemmaAnnotation);
	}

	function hasLinguisticAnnotations(blocks: Array<CorpusAnnotationBlock>): boolean {
		return blocksHaveAnnotation(blocks, hasLinguisticAnnotation);
	}

	function hasInlineTranslations(blocks: Array<CorpusAnnotationBlock>): boolean {
		return blocks.some((block) => block.Translation_spanGrp != null);
	}

	return {
		getUtterances,
		hasInlineTranslations,
		hasLemmaAnnotation,
		hasLemmaAnnotations,
		hasLinguisticAnnotation,
		hasLinguisticAnnotations,
	};
}
