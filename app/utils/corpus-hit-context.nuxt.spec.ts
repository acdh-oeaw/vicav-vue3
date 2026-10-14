// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";

import CorpusTextJsonUtterance from "@/components/corpus-text-json-utterance.vue";
import type { U } from "@/lib/api-client";

import { getCorpusHitContext } from "./corpus-hit-context.ts";

mockNuxtImport("useWindowsStore", () => () => ({ addWindow: vi.fn() }));

function utterance(id: string, tokens: Array<unknown>): U {
	return { "@id": id, $$: tokens } as U;
}

const first = utterance("u1", [{ w: { "@id": "w1", $: "context" } }]);
const second = utterance("u2", [
	{
		w: {
			"@id": "w2",
			$: "ēwa",
			"@lemmaRef": "dict:DShaAr.ii_00000",
			pos: "responseParticle",
		},
	},
	{ pc: { $: "!" } },
]);

describe("corpus hit context", () => {
	it("centers hits across utterances in document order", () => {
		const third = utterance("u3", [{ w: { "@id": "w3", $: "last" } }]);
		const context = getCorpusHitContext({
			us: [first, second, third],
			hits: ["missing", "w3", "w1"],
		});
		expect(context.before).toEqual([]);
		expect(context.matches).toEqual([...first.$$, ...second.$$, ...third.$$]);
		expect(context.after).toEqual([]);
		expect(context.anchorHitId).toBe("w1");
		expect(context.utteranceId).toBe("u1");
	});

	it("includes intervening context between hits in one utterance", () => {
		const tokens = utterance("u3", [
			{ w: { "@id": "before", $: "before" } },
			{ w: { "@id": "a", $: "a" } },
			{ w: { "@id": "between", $: "between" } },
			{ w: { "@id": "b", $: "b" } },
			{ w: { "@id": "after", $: "after" } },
		]);
		const context = getCorpusHitContext({ u: tokens, hits: ["b", "a", "a"] });
		expect(context.before).toEqual(tokens.$$.slice(0, 1));
		expect(context.matches).toEqual(tokens.$$.slice(1, 4));
		expect(context.after).toEqual(tokens.$$.slice(4));
		expect(context.anchorHitId).toBe("a");
	});

	it("keeps all tokens and targets the second utterance containing the hit", async () => {
		const context = getCorpusHitContext({ us: [first, second], hits: ["w2"] });

		expect(context.before).toEqual(first.$$);
		expect(context.matches).toEqual([second.$$[0]]);
		expect(context.after).toEqual([second.$$[1]]);
		expect(context.utteranceId).toBe("u2");

		const wrapper = await mountSuspended(CorpusTextJsonUtterance, {
			props: {
				utterance: context.matches[0]!,
				hits: "w2",
				inlineLemmaAnnotation: true,
				inlineLinguisticAnnotation: true,
			},
		});

		expect(wrapper.text()).toContain("ēwa");
		expect(wrapper.text()).toContain("responseParticle");
		expect(wrapper.get("#w2").attributes("data-highlight-scope")).toBe("word");
		expect(wrapper.find('[aria-label="Open dictionary entry DShaAr.ii_00000"]').exists()).toBe(
			true,
		);
	});

	it("preserves single-utterance results", () => {
		const context = getCorpusHitContext({ u: second, hits: ["w2"] });
		expect(context.before).toEqual([]);
		expect(context.matches).toEqual([second.$$[0]]);
		expect(context.after).toEqual([second.$$[1]]);
		expect(context.utteranceId).toBe("u2");
	});

	it.each(["seg1", "nested"])("finds segment or descendant hits: %s", (hitId) => {
		const compound = utterance("u3", [
			{ seg: { "@id": "seg1", $$: [{ seg: { $$: [{ w: { "@id": "nested", $: "word" } }] } }] } },
		]);
		const context = getCorpusHitContext({ us: [first, compound], hits: [hitId] });
		expect(context.before).toEqual(first.$$);
		expect(context.matches).toEqual([compound.$$[0]]);
		expect(context.utteranceId).toBe("u3");
	});

	it("keeps context without inventing a navigation target when the hit is absent", () => {
		for (const hits of [undefined, [], ["missing"]]) {
			const context = getCorpusHitContext({ us: [first, second], hits });
			expect(context.before).toEqual([...first.$$, ...second.$$]);
			expect(context.matches).toEqual([]);
			expect(context.after).toEqual([]);
			expect(context.utteranceId).toBeUndefined();
			expect(context.anchorHitId).toBeUndefined();
		}
		expect(getCorpusHitContext({}).before).toEqual([]);
	});
});
