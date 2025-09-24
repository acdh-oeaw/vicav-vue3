import type { Row } from "@tanstack/vue-table";
import type { Ref } from "vue";
import { z } from "zod";

type MaybeRef<T> = ComputedRef<T> | Ref<T> | T;

export const DataTypesEnum = z.enum([
	"Profile",
	"Text",
	"SampleText",
	"Feature",
	"CorpusText",
	"BiblioEntries",
]);
export type DataTypesEnum = z.infer<typeof DataTypesEnum>;

export interface DataType {
	name: string;
	targetType: DataTypesEnum;
	categoryId: string;
	collection: string;
	explore_xslt?: string;
	contentTypeHeading: string;
}
export type DataTypes = Record<DataTypesEnum, DataType>;

interface WindowItemBase {
	id: string;
	winbox: WinBox;
	label: string;
}

export const TextId = z.object({
	textId: z.string(),
});
export const TeiSource = z.object({
	teiSource: z.string(),
});
export const ShowCitation = z.object({
	showCitation: z.boolean(),
});
export const QueryString = z.object({
	queryString: z.string(),
});

export const ExploreSamplesQueryBase = z.object({
	ids: z.string().optional(),
	word: z.string().optional(),
	person: z.string().optional(),
	translation: z.string().optional(),
	comment: z.string().optional(),
	features: z.string().optional(),
	page: z.number().optional(),
});

export const ExploreSamplesQueryParams = ExploreSamplesQueryBase.extend({
	dataType: z.enum(["SampleText", "Feature"]),
	region: z.string().optional(),
	settlement: z.string().optional(),
});

export const ExploreSamplesQueryDbParams = ExploreSamplesQueryBase.extend({
	type: z.enum(["samples", "lingfeatures"]),
});

export const ExploreSamplesFormParams = z.object({
	dataTypes: z.array(DataTypesEnum),
});

export const ExploreSamplesSchema = z.object({
	targetType: z.literal("ExploreSamples"),
	params: ExploreSamplesQueryParams.extend(TextId.partial().shape).extend(
		ShowCitation.partial().shape,
	),
});

export type ExploreSamplesWindowItem = WindowItemBase & z.infer<typeof ExploreSamplesSchema>;

export const ExploreSamplesFormSchema = z.object({
	targetType: z.literal("ExploreSamplesForm"),
	params: z
		.object({
			dataTypes: z.array(DataTypesEnum),
		})
		.extend(TextId.partial().shape),
});

export type ExploreSamplesFormWindowItem = WindowItemBase &
	z.infer<typeof ExploreSamplesFormSchema>;

export const BibliographyEntriesSchema = z.object({
	targetType: z.literal("BiblioEntries"),
	params: QueryString.extend({
		xslt: z.string().optional(),
		showMap: z.boolean().optional(),
	}),
});
export type BibliographyEntriesWindowItem = WindowItemBase &
	z.infer<typeof BibliographyEntriesSchema>;

export const Dict = z.object({
	id: z.string(),
	queryTemplates: z.map(z.string(), z.string()),
	dbNames: z.array(z.string()),
	specialCharacters: z.array(z.object({ value: z.string(), text: z.string().optional() })),
});
export const DictQuerySchema = z.object({
	targetType: z.literal("DictQuery"),
	params: z.object({
		textId: Dict.shape.id,
		queryParams: z
			.object({
				q: z.string().optional().nullable(),
				page: z.number().optional().nullable(),
				pageSize: z.number().optional().nullable(),
				id: z.string().optional().nullable(),
				ids: z.string().optional().nullable(),
				sort: z.enum(["asc", "desc", "none"]).optional().nullable(),
				altLemma: z.string().optional().nullable(),
				format: z.string().optional().nullable(),
			})
			.optional(),
		queryString: z.string(),
	}),
});
export type DictQueryWindowItem = WindowItemBase & z.infer<typeof DictQuerySchema>;

export const CorpusQuerySchema = z.object({
	targetType: z.literal("CorpusQuery"),
	params: QueryString,
});
export type CorpusQueryWindowItem = WindowItemBase & z.infer<typeof CorpusQuerySchema>;

export const CorpusTextSchema = z.object({
	targetType: z.literal("CorpusText"),
	params: TextId.extend({
		hits: z.string().optional(),
		u: z.string().optional(), // TODO: give this parameter a telling name
	})
		.extend(ShowCitation.partial().shape)
		.extend(TeiSource.partial().shape),
});
export type CorpusTextWindowItem = WindowItemBase & z.infer<typeof CorpusTextSchema>;

export const FeatureSchema = z.object({
	targetType: z.literal("Feature"),
	params: TextId.extend(TeiSource.partial().shape).extend(ShowCitation.partial().shape),
});
export type FeatureWindowItem = WindowItemBase & z.infer<typeof FeatureSchema>;

export const FeatureValueSchema = z.object({
	targetType: z.literal("FeatureValue"),
	params: z.object({ values: z.array(z.any()) }).extend(ShowCitation.partial().shape),
});
export type FeatureValueWindowItem = WindowItemBase & z.infer<typeof FeatureValueSchema>;

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

export const LocationSchema = z.object({
	targetType: z.literal("Location"),
	params: z.object<Row<FeatureType>>({}).extend(ShowCitation.partial().shape).loose(),
});
export type LocationWindowItem = WindowItemBase & z.infer<typeof LocationSchema>;

export const CompareMarkersParams = z.object();

export const GeoMapScope = z.enum(["reg", "geo", "diaGroup"]);
export const GeoMapSchema = z.object({
	targetType: z.literal("WMap"),
	params: QueryString.extend({
		title: z.string().optional(),
		endpoint: z.string(),
		queryParams: ExploreSamplesQueryDbParams.optional(),
		scope: z.array(GeoMapScope).optional(),
		hideDefaultLayers: z.boolean().optional(),
	}),
});
export type GeoMapWindowItem = WindowItemBase & z.infer<typeof GeoMapSchema>;
export const GeoMapSubnavItemSchema = z.intersection(
	GeoMapSchema,
	z.object({ id: z.string(), title: z.string() }),
);

export const ProfileSchema = z.object({
	targetType: z.literal("Profile"),
	params: TextId.extend(TeiSource.partial().shape).extend(ShowCitation.partial().shape),
});
export type ProfileWindowItem = WindowItemBase & z.infer<typeof ProfileSchema>;

export const TextSchema = z.object({
	targetType: z.literal("Text"),
	params: TextId.extend(TeiSource.partial().shape).extend(ShowCitation.partial().shape),
});
export type TextWindowItem = WindowItemBase & z.infer<typeof TextSchema>;

export const SampleTextSchema = z.object({
	targetType: z.literal("SampleText"),
	params: TextId.extend(TeiSource.partial().shape).extend(ShowCitation.partial().shape),
});
export type SampleTextWindowItem = WindowItemBase & z.infer<typeof SampleTextSchema>;

export const ListMapSchema = z.object({
	targetType: z.literal("ListMap"),
	params: z.unknown(),
});
export type ListMapWindowItem = WindowItemBase & z.infer<typeof ListMapSchema>;

export const MarkerEnum = z.enum(["petal", "default"]);
export type MarkerType = z.infer<typeof MarkerEnum>;
export const GeojsonMapSchema = z.object({
	targetType: z.literal("GeojsonMap"),
	params: z.object({
		url: z.string(),
		markerType: MarkerEnum.optional(),
	}),
});
export type GeojsonMapWindowItem = WindowItemBase & z.infer<typeof GeojsonMapSchema>;

export const DataListSchema = z.object({
	targetType: z.literal("DataList"),
	params: z
		.object({
			dataTypes: z.array(DataTypesEnum),
			filterListBy: z
				.object({
					key: z.string(),
					value: z.string(),
				})
				.optional(),
		})
		.extend(TextId.partial().shape),
});

export type DataListWindowItem = WindowItemBase & z.infer<typeof DataListSchema>;

export const DataTableSchema = z.object({
	targetType: z.literal("DataTable"),
	params: z
		.object({
			dataTypes: z.array(z.enum(["Profile", "Text", "SampleText", "Feature", "CorpusText"])),
			filters: z
				.array(
					z.object({
						key: z.string(),
						value: z.string(),
					}),
				)
				.optional(),
		})
		.extend(TextId.partial().shape)
		.extend(TeiSource.partial().shape)
		.extend(ShowCitation.partial().shape),
});
export type DataTableWindowItem = WindowItemBase & z.infer<typeof DataTableSchema>;

export const Schema = z.discriminatedUnion("targetType", [
	BibliographyEntriesSchema,
	DictQuerySchema,
	CorpusQuerySchema,
	CorpusTextSchema,
	FeatureSchema,
	FeatureValueSchema,
	GeoMapSchema,
	ProfileSchema,
	TextSchema,
	SampleTextSchema,
	ListMapSchema,
	GeojsonMapSchema,
	DataListSchema,
	DataTableSchema,
	ExploreSamplesSchema,
	ExploreSamplesFormSchema,
	LocationSchema,
]);
export type WindowItem = WindowItemBase & z.infer<typeof Schema>;

export type WindowItemTargetType = WindowItem["targetType"];

export type WindowItemMap = {
	[TargetType in WindowItemTargetType]: Extract<WindowItem, { targetType: TargetType }>;
};

export interface VicavHTTPError extends Error {
	status?: number;
	error?: Record<string, string>;
}
