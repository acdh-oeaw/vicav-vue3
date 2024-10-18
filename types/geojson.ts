import { z } from "zod";

export const GeoFeatureSchema = z.object({
	type: z.literal("Feature"),
	id: z.string(),
	geometry: z.object({
		type: z.literal("Point"),
		coordinates: z.array(z.number()),
	}),
	properties: z.any(),
});

export const FeatureCollectionSchema = z.object({
	type: z.literal("FeatureCollection"),
	properties: z.object({
		name: z.string(),
		column_headings: z.array(z.any()),
	}),
	features: z.array(GeoFeatureSchema),
});
