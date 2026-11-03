// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import { getCorpusAudioUrl, rawTeiSourceUrl, resolveCorpusAudio } from "./corpus-audio";

describe("corpus audio references", () => {
	it("resolves referenced public fragments using the TEI prefix definition", () => {
		const xml = `<TEI xmlns="http://www.tei-c.org/ns/1.0"><media xml:id="a-audio-public" url="assets:text/a.mp3"/><media xml:id="a-audio-master" url="assets:private.wav"/><media xml:id="b-audio-public" url="missing:b.mp3"/></TEI>`;
		const urls = resolveCorpusAudio(xml, [
			{
				"@ident": "assets",
				"@matchPattern": "^(.+)$",
				"@replacementPattern": "https://example.org/$1",
			},
		]);
		expect(getCorpusAudioUrl("#a-audio-master #a-audio-public", urls)).toBe(
			"https://example.org/text/a.mp3",
		);
		expect(getCorpusAudioUrl("#b-audio-public", urls)).toBeUndefined();
		expect(getCorpusAudioUrl(undefined, urls)).toBeUndefined();
	});
	it("converts GitHub TEI links and rejects unsupported sources", () => {
		expect(rawTeiSourceUrl("https://github.com/org/repo/blob/abc/text.xml")).toBe(
			"https://raw.githubusercontent.com/org/repo/abc/text.xml",
		);
		expect(rawTeiSourceUrl("https://example.org/text.xml")).toBeUndefined();
	});
});
