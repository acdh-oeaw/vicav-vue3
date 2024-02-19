import type { Ref } from "vue";
import { z } from "zod";

type MaybeRef<T> = Ref<T> | T;

interface WindowItemBase {
	id: string;
	winbox: WinBox;
}

export const TextId = z.object({
	textId: z.string(),
});
export const TeiSource = z.object({
	teiSource: z.string(),
});
export const QueryString = z.object({
	queryString: z.string(),
});

export const BibliographyEntriesSchema = z.object({
	targetType: z.literal("BiblioEntries"),
	params: QueryString.merge(
		z.object({
			xslt: z.string().optional(),
		}),
	),
});
export type BibliographyEntriesWindowItem = WindowItemBase &
	z.infer<typeof BibliographyEntriesSchema>;

export const FeatureSchema = z.object({
	targetType: z.literal("Feature"),
	params: TextId.merge(TeiSource.partial()),
});
export type FeatureWindowItem = WindowItemBase & z.infer<typeof FeatureSchema>;

export const GeoMapScope = z.enum(["reg", "geo", "diaGroup"]);
export const GeoMapSchema = z.object({
	targetType: z.literal("WMap"),
	params: QueryString.merge(
		z.object({
			endpoint: z.string(),
			scope: z.array(GeoMapScope).optional(),
		}),
	),
});
export type GeoMapWindowItem = WindowItemBase & z.infer<typeof GeoMapSchema>;
export const GeoMapSubnavItemSchema = z.intersection(
	GeoMapSchema,
	z.object({ id: z.string(), title: z.string() }),
);

export const ProfileSchema = z.object({
	targetType: z.literal("Profile"),
	params: TextId.merge(TeiSource.partial()),
});
export type ProfileWindowItem = WindowItemBase & z.infer<typeof ProfileSchema>;

export const TextSchema = z.object({
	targetType: z.literal("Text"),
	params: TextId.merge(TeiSource.partial()),
});
export type TextWindowItem = WindowItemBase & z.infer<typeof TextSchema>;

export const ListMapSchema = z.object({
	targetType: z.literal("ListMap"),
	params: z.unknown(),
});
export type ListMapWindowItem = WindowItemBase & z.infer<typeof ListMapSchema>;

export const GeojsonMapSchema = z.object({
	targetType: z.literal("GeojsonMap"),
	params: z.object({
		url: z.string(),
	}),
});
export type GeojsonMapWindowItem = WindowItemBase & z.infer<typeof GeojsonMapSchema>;
export const Schema = z.discriminatedUnion("targetType", [
	BibliographyEntriesSchema,
	FeatureSchema,
	GeoMapSchema,
	ProfileSchema,
	TextSchema,
	ListMapSchema,
	GeojsonMapSchema,
]);
export type WindowItem = WindowItemBase & z.infer<typeof Schema>;

export type WindowItemTargetType = WindowItem["targetType"];

export type WindowItemMap = {
	[TargetType in WindowItemTargetType]: Extract<WindowItem, { targetType: TargetType }>;
};

export const GeoFeatureSchema = z.object({
	type: z.literal("Feature"),
	id: z.string(),
	geometry: z.object({
		type: z.literal("Point"),
		coordinates: z.array(z.number()),
	}),
	properties: z.any(),
});
export type FeatureType = z.infer<typeof GeoFeatureSchema>;

export const FeatureCollectionSchema = z.object({
	type: z.literal("FeatureCollection"),
	properties: z.object({
		name: z.string(),
		column_headings: z.array(z.any()),
	}),
	features: z.array(GeoFeatureSchema),
});
export type FeatureCollectionType = z.infer<typeof FeatureCollectionSchema>;
