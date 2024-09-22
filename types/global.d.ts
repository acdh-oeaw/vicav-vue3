import type { Ref } from "vue";
import { z } from "zod";

type MaybeRef<T> = Ref<T> | T;

export const DataTypesEnum = z.enum(["Profile", "Text", "SampleText", "Feature", "CorpusText"]);
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

export const ExploreSamplesQueryBase = z.object({
	ids: z.string().optional(),
	word: z.string().optional(),
	person: z.string().optional(),
	region: z.string().optional(),
	place: z.string().optional(),
	translation: z.string().optional(),
	comment: z.string().optional(),
	features: z.string().optional(),
	page: z.number().optional(),
});

export const ExploreSamplesQueryParams = ExploreSamplesQueryBase.merge(
	z.object({
		dataType: z.enum(["SampleText", "Feature"]),
	}),
);

export const ExploreSamplesQueryDbParams = ExploreSamplesQueryBase.merge(
	z.object({
		type: z.enum(["samples", "lingfeatures"]),
	}),
);

export const ExploreSamplesFormParams = z.object({
	dataTypes: z.array(DataTypesEnum),
});

export const ExploreSamplesSchema = z.object({
	targetType: z.literal("ExploreSamples"),
	params: ExploreSamplesQueryParams.merge(TextId.partial()).merge(TeiSource.partial()),
});

export type ExploreSamplesWindowItem = WindowItemBase & z.infer<typeof ExploreSamplesSchema>;

export const ExploreSamplesFormSchema = z.object({
	targetType: z.literal("ExploreSamplesForm"),
	params: z
		.object({
			dataTypes: z.array(DataTypesEnum),
		})
		.merge(TextId.partial())
		.merge(TeiSource.partial()),
});

export type ExploreSamplesFormWindowItem = WindowItemBase &
	z.infer<typeof ExploreSamplesFormSchema>;

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

export const Dict = z.object({
	id: z.string(),
	queryTemplates: z.map(z.string(), z.string()),
	dbNames: z.array(z.string()),
	specChars: z.array(z.string()),
});
export const DictQuerySchema = z.object({
	targetType: z.literal("DictQuery"),
	params: z.object({
		textId: Dict.shape.id,
		queryParams: z
			.object({
				q: z.string().optional(),
				page: z.number().optional(),
				pageSize: z.number().optional(),
				id: z.string().optional(),
				ids: z.string().optional(),
				sort: z.enum(["asc", "desc", "none"]).optional(),
				altLemma: z.string().optional(),
				format: z.string().optional(),
			})
			.optional(),
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
	params: TextId.merge(
		z.object({
			hits: z.string().optional(),
			u: z.string().optional(), // TODO: give this parameter a telling name
		}),
	),
});
export type CorpusTextWindowItem = WindowItemBase & z.infer<typeof CorpusTextSchema>;

export const FeatureSchema = z.object({
	targetType: z.literal("Feature"),
	params: TextId.merge(TeiSource.partial()),
});
export type FeatureWindowItem = WindowItemBase & z.infer<typeof FeatureSchema>;

export const CompareMarkersParams = z.object();

export const GeoMapScope = z.enum(["reg", "geo", "diaGroup"]);
export const GeoMapSchema = z.object({
	targetType: z.literal("WMap"),
	params: QueryString.merge(
		z.object({
			title: z.string().optional(),
			endpoint: z.string(),
			queryParams: ExploreSamplesQueryDbParams.optional(),
			scope: z.array(GeoMapScope).optional(),
			hideDefaultLayers: z.boolean().optional(),
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

export const SampleTextSchema = z.object({
	targetType: z.literal("SampleText"),
	params: TextId.merge(TeiSource.partial()),
});
export type SampleTextWindowItem = WindowItemBase & z.infer<typeof SampleTextSchema>;

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

export const DataListSchema = z.object({
	targetType: z.literal("DataList"),
	params: z
		.object({
			dataTypes: z.array(DataTypesEnum),
			filterListBy: z.string().optional(),
		})
		.merge(TextId.partial())
		.merge(TeiSource.partial()),
});

export type DataListWindowItem = WindowItemBase & z.infer<typeof DataListSchema>;

export const DataTableSchema = z.object({
	targetType: z.literal("DataTable"),
	params: z
		.object({
			dataTypes: z.array(z.enum(["Profile", "Text", "SampleText", "Feature", "CorpusText"])),
		})
		.merge(TextId.partial())
		.merge(TeiSource.partial()),
});
export type DataTableWindowItem = WindowItemBase & z.infer<typeof DataTableSchema>;

export const Schema = z.discriminatedUnion("targetType", [
	BibliographyEntriesSchema,
	DictQuerySchema,
	CorpusQuerySchema,
	CorpusTextSchema,
	FeatureSchema,
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

export interface simpleTEIMetadata {
	id: string;
	label: string;
	dataType: DataTypesEnum;
	secondaryDataType: string;
	resp: string;
	place: {
		settlement: string;
		country: string;
		region: string;
	};
	person: {
		name: string;
		sex: string;
		age: string;
	};
	hasTEIw: boolean;
	teiHeader: TeiHeader;
}

// TeiCropus metadata definition

export interface TeiCorpus {
	"@id": string;
	TEIs: Array<TEI>;
	teiHeader?: TeiHeader;
	standOff?: StandOff;
}

export interface TEI {
	"@space"?: string;
	"@id"?: string;
	teiHeader: TeiHeader;
	"@type"?: string;
	"@hasTEIw"?: string;
	"@next"?: string;
	"@prev"?: string;
}

export interface TeiHeader {
	"@id"?: string;
	fileDesc: FileDesc;
	encodingDesc: EncodingDesc;
	profileDesc?: ProfileDesc;
	revisionDesc?: RevisionDesc;
}

export interface FileDesc {
	titleStmt: TitleStmt;
	publicationStmt: PublicationStmt;
	sourceDesc: SourceDesc;
	noteStmt?: NoteStmt;
	editionStmt?: EditionStmt;
	extent?: unknown;
}

export interface TitleStmt {
	titles?: Array<TeiTypedTarget>;
	author?: Author;
	editor?: Editor;
	respStmts?: Array<RespStmt>;
	funder?: Funder;
}

export interface Author {
	"@id"?: string;
	$: string;
}

export interface Editor {
	"@id": string;
	"@role": string;
	$: string;
}

export interface XmlTextNode {
	$: string;
}

export interface RespStmt {
	persName?: PersName | TeiTypedTarget;
	resp: XmlTextNode;
	name?: Author;
	author?: Author;
}

export interface PersName {
	"@ref"?: string;
	"@id": string;
	"@full"?: string;
	$?: string;
	"@forename"?: string;
	"@surname"?: string;
	forename?: XmlTextNode;
	surname?: XmlTextNode;
}

export interface PublicationStmt {
	pubPlace?: XmlTextNode;
	date: TeiDate;
	availability: Availability;
	publishers?: Array<TeiTypedTarget>;
	distributor?: TeiTypedTarget;
	address?: Address;
	idno?: TeiTypedTarget;
}

export interface TeiDate {
	$?: string;
	"@when"?: Date | string;
	"@type"?: string;
	"@from"?: Date | string;
	"@to"?: Date | string;
	note: XmlTextNode;
}

export interface Availability {
	"@status": string;
	p?: P;
	licence?: TeiTypedTarget;
}

export interface P {
	ptr?: TeiTypedTarget;
	code?: XmlTextNode;
	ref?: TeiTypedTarget;
	$?: string;
	att?: XmlTextNode;
	gi?: XmlTextNode;
}

export interface TeiTypedTarget {
	"@ref"?: string;
	"@type"?: string;
	"@subtype"?: string;
	"@target"?: string;
	"@level"?: string;
	$?: string;
}

export interface Address {
	addrLine: XmlTextNode;
}

export interface SourceDesc {
	p?: P;
	listBibl?: ListBibl;
	recordingStmt?: RecordingStmt;
}

export interface ListBibl {
	"@type": string;
}
export interface RecordingStmt {
	recording: Recording;
}

export interface Recording {
	"@dur-iso": string;
	"@type": string;
	date?: TeiDate;
	respStmt: RespStmt;
	media?: Media;
	p?: P;
}

export interface Media {
	"@url": string;
	"@mimeType": string;
	"@type": string;
}
export interface NoteStmt {
	relatedItem: RelatedItemOrPtr;
}
export interface RelatedItemOrPtr {
	"@type": string;
	title: XmlTextNode;
	ptr: TeiTypedTarget;
}
export interface EditionStmt {
	edition: XmlTextNode;
}
export interface EncodingDesc {
	classDecl?: ClassDecl;
	listPrefixDef?: Array<ListPrefixDef>;
	tagsDecl?: TagsDecl;
	projectDesc?: SourceDescOrProjectDescOrEditorialDecl;
	editorialDecl?: SourceDescOrProjectDescOrEditorialDecl;
}

export interface ListPrefixDef {
	"@ident": string;
	"@matchPattern": string;
	"@replacementPattern": string;
	p?: P;
}

export interface TagsDecl {
	"@partial"?: string;
	renditions?: Array<Rendition>;
	namespace?: Namespace;
}

export interface Rendition {
	"@id": string;
	"@scheme": string;
	$: string;
}

export interface Namespace {
	"@name": string;
	tagUsage: TagUsage;
}

export interface TagUsage {
	"@gi": string;
}

export interface SourceDescOrProjectDescOrEditorialDecl {
	p: XmlTextNode;
}

export interface ProfileDesc {
	langUsage?: LangUsage;
	textDesc?: TextDesc;
	particDesc?: ParticDesc;
	textClass?: TextClass;
	settingDesc?: SettingDesc;
}

export interface Taxonomy {
	categories?: Array<Category>;
}

export interface Category {
	"@id": string;
	"@n"?: string;
	catDesc: XmlTextNode;
}

export interface LangUsage {
	language: Language;
}

export interface Language {
	"@ident": string;
	"@type": string;
	name: TeiTypedTarget;
	place: Place;
	TeiDate: TeiDate;
	personGrp: PersonGrp;
	channel: Channel;
	domain: unknown;
	person: unknown;
	langKnowledge: LangKnowledge;
	purpose: unknown;
	ptr?: RelatedItemOrPtr;
}

export interface Geo {
	"@decls": string;
	$: string;
}

export interface Country {
	"@key": string;
	$: string;
}

export interface PersonGrp {
	age: unknown;
	gender: XmlTextNode;
	faith: XmlTextNode;
	education: unknown;
	nationality: TeiTypedTarget;
	residence: unknown;
	occupation: unknown;
	socecStatus: XmlTextNode;
	note: unknown;
}
export interface Channel {
	"@mode": string;
}
export interface LangKnowledge {
	langKnown: LangKnown;
}
export interface LangKnown {
	"@tag": string;
}
export interface TextDesc {
	channel: unknown;
	constitution: unknown;
	derivation: unknown;
	domain: unknown;
	factuality: unknown;
	interaction: unknown;
	preparedness: unknown;
	purpose: unknown;
}
export interface ParticDesc {
	person?: Person;
	listPerson?: Array<Person>;
}

export interface Person {
	"@sameAs"?: string;
	"@id"?: string;
	"@sex"?: string;
	"@age"?: string;
	name?: TeiTypedTarget;
	persName?: PersName;
	sex?: XmlTextNode;
	birth?: Birth | XmlTextNode;
	note?: XmlTextNode;
	state?: State;
	idno?: Idno;
	affiliation?: XmlTextNode;
	$?: string;
}

export interface SettingDesc {
	setting?: Setting;
	place?: Place;
}

export interface Place {
	"@type"?: string;
	"@id"?: string;
	"@sameAs"?: string;
	placeName?: XmlTextNode;
	settlement?: Settlement;
	region?: XmlTextNode;
	country?: XmlTextNode;
	location?: Location;
	idno?: TeiTypedTarget;
	note?: XmlTextNode;
}

export interface Settlement {
	name?: Array<NameEntity>;
}

export interface NameEntity {
	"@lang": string;
	$: string;
}
export interface Location {
	"@type"?: string;
	country?: Country;
	geo: Geo;
}
export interface Setting {
	placeName: PlaceName;
}

export interface PlaceName {
	"@sameAs": string;
	$: string;
}

export interface TextClass {
	catRef?: TeiTypedTarget;
}

export interface RevisionDesc {
	changes?: Array<Change>;
}

export interface Change {
	"@status"?: string;
	"@n"?: string;
	"@when": Date;
	"@who"?: string;
	persName?: PersName;
	$?: string;
}

export interface Funder {
	orgName: TeiTypedTarget;
	idno: TeiTypedTarget;
	$: string;
}

export interface ClassDecl {
	taxonomy: Taxonomy;
}

export interface StandOff {
	listPerson?: Array<Person>;
}

export interface State {
	"@type": string;
	desc: XmlTextNode;
}

export interface Birth {
	date?: BirthDate;
	placeName?: XmlTextNode;
}

export interface BirthDate {
	"@notBefore"?: Date | string;
	"@notAfter"?: Date | string;
	$?: string;
	"@when"?: Date | string;
}

export interface VicavHTTPError extends Error {
	status?: number;
	error?: Record<string, string>;
}
