// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import type { RestVLEEntry } from "@/lib/api-client";

import {
	deriveBibliographyQueryString,
	formatLocation,
	normalizeEntry,
} from "./dict-entry-rendering.ts";

describe("dict-entry rendering", () => {
	it("normalizes compact dictionary entry display data", () => {
		const entry = {
			id: "entry-1",
			lemma: "darab [verb]",
			type: "entry",
			_links: { self: { href: "/restvle/dicts/test/entries/entry-1" } },
			entry: {
				entry: {
					"@id": "entry-1",
					"@lang": "ar-test",
					lemma_form: {
						"@source": "#source1",
						"@type": "lemma",
						geographic_usgs: [
							{
								"@type": "geographic",
								place_name: { "@type": "place", $: "Harran-Urfa" },
							},
							{
								"@type": "geographic",
								place_name: { "@type": "place", $: "Beqaa" },
								tribe_names: [
									{ "@type": "tribe", $: "Idin" },
									{ "@type": "tribe", $: "Abu Id" },
								],
							},
						],
						orth: { "@lang": "ar-Latn", $: "darab" },
					},
					inflected_form: {
						"@source": "#source1",
						"@type": "inflected",
						gramGrp: {
							aspect_gram: { "@type": "aspect", $: "imperfective" },
							number_gram: { "@type": "number", $: "singular" },
							person_gram: { "@type": "person", $: "3" },
						},
						geographic_usg: {
							"@type": "geographic",
							place_name: { "@type": "place", $: "Harran-Urfa" },
						},
						orth: { "@lang": "ar-Latn", $: "yadrub" },
						variant_form: {
							"@source": "#source1",
							"@type": "variant",
							geographic_usg: {
								"@type": "geographic",
								place_name: { "@type": "place", $: "Mayadin" },
							},
							orth: { "@lang": "ar-Latn", $: "yudrub" },
						},
					},
					gramGrp: {
						pos_gram: { "@type": "pos", $: "verb" },
						derivedVerbClass_gram: { "@type": "derivedVerbClass", $: "I" },
						synRoot_gram: { "@type": "synRoot", $: "drb" },
						diaRoot_gram: { "@type": "diaRoot", $: "-" },
					},
					etym: {
						etym: {
							etymon_cit: {
								"@type": "etymon",
								form: {
									orths: [
										{ "@lang": "gr", $: "κουντοῦρα" },
										{ "@lang": "gr-Latn", $: "kountoûra" },
									],
								},
							},
						},
						etymon_cit: {
							"@type": "etymon",
							form: { orth: { "@lang": "tr", $: "badem" } },
						},
					},
					sense: {
						"@id": "sense-1",
						example_cit: {
							"@id": "example-1",
							"@source": "#source1",
							quote: { "@lang": "ar-Latn", $: "darab al-walad" },
							listBibl: [
								{
									"@id": "example-source",
									title: { $: "Cantineau 1936" },
									biblScope: { "@unit": "page", $: "p. 42" },
								},
							],
						},
						translationEquivalent_cit: {
							"@source": "#source1",
							"@type": "translationEquivalent",
							form: { orth: { "@lang": "en", $: "to hit" } },
							gloss: { $: "with a stick" },
						},
						geographic_usgs: [
							{
								"@type": "geographic",
								place_name: { "@type": "place", $: "Harran-Urfa" },
							},
							{
								"@type": "geographic",
								place_name: { "@type": "place", $: "Harran-Urfa" },
							},
						],
					},
					listBibl: [
						{
							"@id": "source1",
							title: { "@ref": "zot:Lentin2013" },
							biblScope: { "@unit": "page", $: "p.164" },
						},
					],
					features: [{ change: { who: "StephanP", when: "2026-01-30", status: "released" } }],
				},
			},
		};

		const normalized = normalizeEntry(entry as unknown as RestVLEEntry);

		expect(normalized.bibliography).toEqual([
			{
				label: "Lentin 2013, p.164",
				queryString: "Lentin 2013",
				rawReference: "zot:Lentin2013",
				sourceId: "source1",
			},
		]);
		expect(normalized.etymologies).toEqual([
			{ lang: "tr", text: "badem" },
			{ lang: "gr", text: "κουντοῦρα" },
			{ lang: "gr-Latn", text: "kountoûra" },
		]);
		expect(normalized.etymologyGroups).toEqual([
			{
				etymologies: [
					{ lang: "tr", text: "badem" },
					{ lang: "gr", text: "κουντοῦρα" },
					{ lang: "gr-Latn", text: "kountoûra" },
				],
				levels: [
					[{ lang: "tr", text: "badem" }],
					[
						{ lang: "gr", text: "κουντοῦρα" },
						{ lang: "gr-Latn", text: "kountoûra" },
					],
				],
			},
		]);
		expect(normalized.lemmaForms[0]?.source).toBe("source1");
		expect(normalized.lemmaForms[0]?.locations.map(formatLocation)).toEqual([
			"Harran-Urfa",
			"Beqaa, Idin",
		]);
		expect(normalized.inflectedForms[0]?.variants[0]?.source).toBe("source1");
		expect(normalized.inflectedForms[0]?.source).toBe("source1");
		expect(normalized.senses[0]?.translations[0]).toMatchObject({
			gloss: "with a stick",
			lang: "en",
			source: "source1",
			text: "to hit",
		});
		expect(normalized.senses[0]?.locations.map(formatLocation)).toEqual(["Harran-Urfa"]);
		expect(normalized.senses[0]?.examples[0]).toMatchObject({
			source: "source1",
			bibliography: [
				{
					label: "Cantineau 1936, p. 42",
					queryString: "Cantineau 1936",
					sourceId: "example-source",
				},
			],
		});
	});

	it("derives bibliography queries from Zotero identifiers without disambiguation or page scope", () => {
		expect(deriveBibliographyQueryString("zot:Bettini_2006_0000", "ignored, p. 10")).toBe(
			"Bettini 2006",
		);
		expect(deriveBibliographyQueryString("zot:Lentin2013a", "ignored, p. 10")).toBe("Lentin 2013");
		expect(deriveBibliographyQueryString(undefined, "Cantineau 1936")).toBe("Cantineau 1936");
	});
});
