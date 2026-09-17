import { useCorpusAnnotationAvailability } from "@/composables/use-corpus-annotation-availability.ts";
import type { Div, MixedUtteranceContent } from "@/lib/api-client";

function tokenContainsHit(token: MixedUtteranceContent[number], hitId?: string): boolean {
	if (hitId == null) return false;
	return (
		token.w?.["@id"] === hitId ||
		token.seg?.["@id"] === hitId ||
		token.seg?.$$.some((child) => tokenContainsHit(child, hitId)) === true
	);
}

export function getCorpusHitContext(hit: Pick<Div, "u" | "us" | "hits">) {
	const { getUtterances } = useCorpusAnnotationAvailability();
	const utterances = getUtterances(hit);
	const hitId = hit.hits?.[0];
	const tokens = utterances.flatMap((utterance) => utterance.$$);
	const matchIndex = tokens.findIndex((token) => tokenContainsHit(token, hitId));
	const utteranceId = utterances.find((utterance) =>
		utterance.$$.some((token) => tokenContainsHit(token, hitId)),
	)?.["@id"];

	return {
		utteranceId,
		before: matchIndex === -1 ? tokens : tokens.slice(0, matchIndex),
		match: matchIndex === -1 ? undefined : tokens[matchIndex],
		after: matchIndex === -1 ? [] : tokens.slice(matchIndex + 1),
	};
}
