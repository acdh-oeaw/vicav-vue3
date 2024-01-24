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

const DictId = z.string();
export type DictId = z.infer<typeof DictId>;
export const Dict = z.object({
	id: DictId,
	queryTemplates: z.array(z.string()),
	dbNames: z.array(z.string()),
});
export type DictType = Zod.infer<typeof Dict>;
export const DictQuerySchema = z.object({
	targetType: z.literal("DictQuery"),
	params: z.object({
		textId: Dict.shape.id,
	}),
});
export type DictQueryWindowItem = WindowItemBase & z.infer<typeof DictQuerySchema>;

export const FeatureSchema = z.object({
	targetType: z.literal("Feature"),
	params: TextId.merge(TeiSource),
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
	params: TextId.merge(TeiSource),
});
export type ProfileWindowItem = WindowItemBase & z.infer<typeof ProfileSchema>;

export const TextSchema = z.object({
	targetType: z.literal("Text"),
	params: TextId.merge(TeiSource),
});
export type TextWindowItem = WindowItemBase & z.infer<typeof TextSchema>;

export const Schema = z.discriminatedUnion("targetType", [
	BibliographyEntriesSchema,
	DictQuerySchema,
	FeatureSchema,
	GeoMapSchema,
	ProfileSchema,
	TextSchema,
]);
export type WindowItem = WindowItemBase & z.infer<typeof Schema>;

export type WindowItemTargetType = WindowItem["targetType"];

export type WindowItemMap = {
	[TargetType in WindowItemTargetType]: Extract<WindowItem, { targetType: TargetType }>;
};
