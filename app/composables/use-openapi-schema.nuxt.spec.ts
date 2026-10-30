// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import * as z from "zod";

import { useOpenapiSchema } from "@/composables/use-openapi-schema.ts";

/** A gazetteer place, as served by `staticData.geo[].features[].properties`. */
const geoPlaceProperties = {
	"@type": "geo",
	"@id": "abeche",
	location: {
		geos: [
			{ "@decls": "#dms", $: "13°31'09\"N 18°34'52\"E" },
			{ "@decls": "#dd", $: "13.5191 18.5812" },
		],
	},
	prefLabel_placeName: { "@type": "prefLabel", $: "Abéché" },
};

/** A wibarab variety place, described by feature types. */
const varietyProperties = {
	name: "Abéché",
	country: "Chad",
	alternateNames: [{ lang: "ar", name: "أبِشي" }, { name: "Abeche" }],
	ft_akl_3sgm_ipfv: {
		"biʔākul, bākul": [
			{
				resp: "Stanley Kochem",
				source: { bibl_id: "Kochem2019", link: "", short_cit: "Kochem 2019" },
				variety: "Abéché",
			},
		],
	},
};

/** A map marker, as served by the marker endpoints. */
const markerProperties = {
	type: "geo",
	name: "abeche",
	label: "Abéché",
	alt: "Abéché",
	hitCount: 3,
	targetType: "WMap",
	params: {},
};

function feature(properties: unknown) {
	return { type: "Feature", properties, geometry: null };
}

function featureSchema(name: string) {
	const schema = useOpenapiSchema(name);
	expect(schema).not.toBe(false);
	return z.fromJSONSchema(schema);
}

describe("useOpenapiSchema", () => {
	it("converts the schemas that are used at module scope", () => {
		expect(() => featureSchema("Feature")).not.toThrow();
		expect(() => featureSchema("GeoPlace")).not.toThrow();
		expect(() => featureSchema("TeiCorpus")).not.toThrow();
	});
});

describe("Feature.properties", () => {
	const FeatureSchema = featureSchema("Feature");

	it("accepts the three payload shapes it models", () => {
		expect(FeatureSchema.safeParse(feature(geoPlaceProperties)).success).toBe(true);
		expect(FeatureSchema.safeParse(feature(varietyProperties)).success).toBe(true);
		expect(FeatureSchema.safeParse(feature(markerProperties)).success).toBe(true);
		expect(FeatureSchema.safeParse(feature(null)).success).toBe(true);
	});

	it("keeps the union exclusive", () => {
		const result = FeatureSchema.safeParse(feature({ ...geoPlaceProperties, ...markerProperties }));

		expect(result.success).toBe(false);
		expect(result.error?.issues.map((issue) => issue.code)).toContain("invalid_union");
	});

	it("rejects payloads that match no branch", () => {
		expect(FeatureSchema.safeParse(feature({})).success).toBe(false);
		expect(FeatureSchema.safeParse(feature({ a: 1 })).success).toBe(false);
	});

	it("rejects malformed variety payloads", () => {
		expect(
			FeatureSchema.safeParse(feature({ ...varietyProperties, unknownKey: true })).success,
		).toBe(false);
		expect(
			FeatureSchema.safeParse(
				feature({
					...varietyProperties,
					ft_akl_3sgm_ipfv: {
						"biʔākul, bākul": [{ source: {}, variety: "Abéché" }],
					},
				}),
			).success,
		).toBe(false);
	});
});
