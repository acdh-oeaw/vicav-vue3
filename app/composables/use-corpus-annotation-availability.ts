import type { Div, U } from "@/lib/api-client";

type CorpusAnnotationBlock = Pick<Div, "Translation_spanGrp" | "u" | "us">;

export function useCorpusAnnotationAvailability() {
	function getUtterances(div: Pick<Div, "u" | "us">): Array<U> {
		return [div.u, ...(div.us ?? [])].filter((u) => u !== undefined);
	}

	function hasTokenAnnotation(token: U["$$"][number]): boolean {
		if (token.w) {
			return (
				token.w["@lemmaRef"] != null ||
				token.w["@msd"] != null ||
				token.w.pos != null ||
				token.w.synRoot != null ||
				token.w.diaRoot != null
			);
		}

		return token.seg?.$$.some(hasTokenAnnotation) ?? false;
	}

	function hasInlineAnnotations(blocks: Array<CorpusAnnotationBlock>): boolean {
		return blocks.some((block) =>
			getUtterances(block).some((utterance) => utterance.$$.some(hasTokenAnnotation)),
		);
	}

	function hasInlineTranslations(blocks: Array<CorpusAnnotationBlock>): boolean {
		return blocks.some((block) => block.Translation_spanGrp != null);
	}

	return {
		getUtterances,
		hasInlineAnnotations,
		hasInlineTranslations,
		hasTokenAnnotation,
	};
}
