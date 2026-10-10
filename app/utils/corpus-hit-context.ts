import { useCorpusAnnotationAvailability } from "@/composables/use-corpus-annotation-availability.ts";
import type { Div, MixedUtteranceContent } from "@/lib/api-client";

function findTokenHitId(
	token: MixedUtteranceContent[number],
	hitIds: ReadonlySet<string>,
): string | undefined {
	const id = token.w?.["@id"] ?? token.seg?.["@id"];
	if (id != null && hitIds.has(id)) return id;
	for (const child of token.seg?.$$ ?? []) {
		const childHitId = findTokenHitId(child, hitIds);
		if (childHitId != null) return childHitId;
	}
	return undefined;
}

export function getCorpusHitContext(hit: Pick<Div, "u" | "us" | "hits">) {
	const { getUtterances } = useCorpusAnnotationAvailability();
	const hitIds = new Set(hit.hits ?? []);
	const tokens = getUtterances(hit).flatMap((utterance) =>
		utterance.$$.map((token) => ({
			token,
			utteranceId: utterance["@id"],
			hitId: findTokenHitId(token, hitIds),
		})),
	);
	const firstMatchIndex = tokens.findIndex(({ hitId }) => hitId != null);
	const lastMatchIndex = tokens.findLastIndex(({ hitId }) => hitId != null);
	const anchor = tokens[firstMatchIndex];
	const content = tokens.map(({ token }) => token);

	return {
		utteranceId: anchor?.utteranceId,
		anchorHitId: anchor?.hitId,
		before: firstMatchIndex === -1 ? content : content.slice(0, firstMatchIndex),
		matches: firstMatchIndex === -1 ? [] : content.slice(firstMatchIndex, lastMatchIndex + 1),
		after: lastMatchIndex === -1 ? [] : content.slice(lastMatchIndex + 1),
	};
}
