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
	params: TextId,
});
export type FeatureWindowItem = WindowItemBase & z.infer<typeof FeatureSchema>;

export const GeoMapScope = z.enum(["reg", "geo", "diaGroup"]);
export const GeoMapSchema = z.object({
	targetType: z.literal("WMap"),
	params: z.object({
		endpoint: z.string(),
		query: z.string().optional(),
		scope: z.array(GeoMapScope).optional(),
	}),
});
export type GeoMapWindowItem = WindowItemBase & z.infer<typeof GeoMapSchema>;

export const ProfileSchema = z.object({
	targetType: z.literal("Profile"),
	params: TextId,
});
export type ProfileWindowItem = WindowItemBase & z.infer<typeof ProfileSchema>;

export const TextSchema = z.object({
	targetType: z.literal("Text"),
	params: TextId,
});
export type TextWindowItem = WindowItemBase & z.infer<typeof TextSchema>;

export const Schema = z.discriminatedUnion("targetType", [
	BibliographyEntriesSchema,
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
