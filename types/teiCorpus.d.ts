/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { JsonValue } from "type-fest";

type simplePerson = {
	name: string;
	sex: string;
	age: string;
};
type Author = {
	given: string;
	family: string;
};
export type simpleTEIMetadata = {
	id: string;
	label: string;
	title: string;
	author: Array<Author>;
	recording: Array<Author>;
	principal: Array<Author>;
	transcription: Array<Author>;
	"transfer to ELAN": Array<Author>;
	dataType: DataTypesEnum;
	category: string;
	resp: string;
	pubDate: string | TeiDate;
	recordingDate?: string | TeiDate;
	duration?: string;
	audioAvailability: string;
	place: {
		settlement: string;
		country: string;
		region: string;
	};
	person: Array<simplePerson>;
	"@hasTEIw": string;
	teiHeader: TeiHeader;
	publication: {
		refType: "external" | "internal";
		type: string;
		bibl: {
			author: Array<Author>;
			editor?: Array<Author>;
			title: string;
			"container-title"?: string;
			issued: Array<string>;
			page?: string;
			volume?: string;
			publisherPlace?: string;
		};
	};
};

export type Responsibility =
	| "author"
	| "recording"
	| "principal"
	| "transcription"
	| "transfer to ELAN";

// TeiCropus metadata definition

export type TeiCorpus = {
	"@id": string;
	TEIs: Array<TEI>;
	teiHeader?: TeiHeader;
	standOff?: StandOff;
};

export type TEI = {
	"@space"?: string;
	"@id"?: string;
	teiHeader: TeiHeader;
	"@type"?: string;
	"@hasTEIw"?: string;
	"@next"?: string;
	"@prev"?: string;
};

export type TeiHeader = {
	"@id"?: string;
	fileDesc: FileDesc;
	encodingDesc?: EncodingDesc;
	profileDesc?: ProfileDesc;
	revisionDesc?: RevisionDesc;
};

export type FileDesc = {
	titleStmt: TitleStmt;
	publicationStmt: PublicationStmt;
	sourceDesc: SourceDesc;
	noteStmt?: NoteStmt;
	editionStmt?: EditionStmt;
	extent?: JsonValue;
};

export type TitleStmt = {
	titles?: Array<TeiTypedTarget>;
	author?: Author;
	editor?: Editor;
	respStmts?: Array<RespStmt>;
	funder?: Funder;
};

export type Author = {
	"@id"?: string;
	$: string;
};

export type Editor = {
	"@id": string;
	"@role": string;
	$: string;
};

export type XmlTextNode = {
	$: string;
};

export type RespStmt = {
	persName?: PersName | TeiTypedTarget;
	resp: { $: Responsibility };
	name?: Author;
	author?: Author;
};

export type PersName = {
	"@ref"?: string;
	"@id": string;
	"@full"?: string;
	$?: string;
	forename?: XmlTextNode;
	surname?: XmlTextNode;
};

export type PublicationStmt = {
	pubPlace?: XmlTextNode;
	date?: TeiDate;
	availability: Availability;
	publishers?: Array<TeiTypedTarget>;
	distributor?: TeiTypedTarget;
	address?: Address;
	idno?: TeiTypedTarget;
};

export type TeiDate = {
	$?: string;
	"@when"?: string;
	"@type"?: string;
	"@from"?: string;
	"@to"?: string;
	note: XmlTextNode;
};

export type Availability = {
	"@status": string;
	p?: P;
	licence?: TeiTypedTarget;
};

export type P = {
	ptr?: TeiTypedTarget;
	code?: XmlTextNode;
	ref?: TeiTypedTarget;
	$?: string;
	att?: XmlTextNode;
	gi?: XmlTextNode;
};

export type TeiTypedTarget = {
	"@ref"?: string;
	"@type"?: string;
	"@subtype"?: string;
	"@target"?: string;
	"@level"?: string;
	$?: string;
};

export type Address = {
	addrLine: XmlTextNode;
};

export type SourceDesc = {
	p?: P;
	listBibl?: ListBibl;
	recordingStmt?: RecordingStmt;
	biblStruct?: BiblStruct;
};

export type BiblStruct = {
	"@type": string;
	analytic?: {
		title: XmlTextNode;
		author: PersName;
	};
	monogr: {
		title?: TeiTypedTarget;
		author?: PersName;
		editor?: PersName;
		imprint?: {
			date: XmlTextNode;
			pubPlace?: XmlTextNode;
			biblScopes: Array<{
				"@unit": string;
				$: string;
			}>;
		};
	};
};

export type ListBibl = {
	"@type": string;
};
export type RecordingStmt = {
	recording: Recording;
};

export type Recording = {
	"@dur-iso": string;
	"@type": string;
	date?: TeiDate;
	respStmt?: RespStmt;
	media?: Media;
	p?: P;
};

export type Media = {
	"@url": string;
	"@mimeType": string;
	"@type": string;
};
export type NoteStmt = {
	relatedItem: RelatedItemOrPtr;
};
export type RelatedItemOrPtr = {
	"@type": string;
	title: XmlTextNode;
	ptr: TeiTypedTarget;
};
export type EditionStmt = {
	edition: XmlTextNode;
};
export type EncodingDesc = {
	classDecl?: ClassDecl;
	listPrefixDef?: Array<ListPrefixDef>;
	tagsDecl?: TagsDecl;
	projectDesc?: SourceDescOrProjectDescOrEditorialDecl;
	editorialDecl?: SourceDescOrProjectDescOrEditorialDecl;
};

export type ListPrefixDef = {
	"@ident": string;
	"@matchPattern": string;
	"@replacementPattern": string;
	p?: P;
};

export type TagsDecl = {
	"@partial"?: string;
	renditions?: Array<Rendition>;
	namespace?: Namespace;
};

export type Rendition = {
	"@id": string;
	"@scheme": string;
	$: string;
};

export type Namespace = {
	"@name": string;
	tagUsage: TagUsage;
};

export type TagUsage = {
	"@gi": string;
};

export type SourceDescOrProjectDescOrEditorialDecl = {
	p: XmlTextNode;
};

export type ProfileDesc = {
	langUsage?: LangUsage;
	textDesc?: TextDesc;
	particDesc?: ParticDesc;
	textClass?: TextClass;
	settingDesc?: SettingDesc;
};

export type Taxonomy = {
	categories: Array<Category>;
};

export type Category = {
	"@id": string;
	"@n"?: string;
	catDesc: CatDesc;
};

export type CatDesc = {
	name?: XmlTextNode;
	$?: string;
};

export type LangUsage = {
	language: Language;
};

export type Language = {
	"@ident": string;
	"@type": string;
	name: TeiTypedTarget;
	place: Place;
	TeiDate: TeiDate;
	personGrp: PersonGrp;
	channel: Channel;
	domain: JsonValue;
	person: JsonValue;
	langKnowledge: LangKnowledge;
	purpose: JsonValue;
	ptr?: RelatedItemOrPtr;
};

export type Geo = {
	"@decls": string;
	$: string;
};

export type Country = {
	"@key": string;
	$: string;
};

export type PersonGrp = {
	age: JsonValue;
	gender: XmlTextNode;
	faith: XmlTextNode;
	education: JsonValue;
	nationality: TeiTypedTarget;
	residence: JsonValue;
	occupation: JsonValue;
	socecStatus: XmlTextNode;
	note: JsonValue;
};
export type Channel = {
	"@mode": string;
};
export type LangKnowledge = {
	langKnown: LangKnown;
};
export type LangKnown = {
	"@tag": string;
};
export type TextDesc = {
	channel: JsonValue;
	constitution: JsonValue;
	derivation: JsonValue;
	domain: JsonValue;
	factuality: JsonValue;
	interaction: JsonValue;
	preparedness: JsonValue;
	purpose: JsonValue;
};
export type ParticDesc = {
	person?: Person;
	listPerson?: Array<Person>;
};

export type Person = {
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
	idno?: TeiTypedTarget;
	affiliation?: XmlTextNode;
	$?: string;
};

export type SettingDesc = {
	setting?: Setting;
	place?: Place;
};

export type Place = {
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
};

export type Settlement = {
	name?: Array<NameEntity>;
};

export type NameEntity = {
	"@lang": string;
	$: string;
};
export type Location = {
	"@type"?: string;
	country?: Country;
	geo: Geo;
};
export type Setting = {
	placeName: PlaceName;
};

export type PlaceName = {
	"@sameAs": string;
	$: string;
};

export type TextClass = {
	catRefs?: Array<TeiTypedTarget>;
};

export type RevisionDesc = {
	changes?: Array<Change>;
};

export type Change = {
	"@status"?: string;
	"@n"?: string;
	"@when": string;
	"@who"?: string;
	persName?: PersName;
	$?: string;
};

export type Funder = {
	orgName: TeiTypedTarget;
	idno: TeiTypedTarget;
	$: string;
};

export type ClassDecl = {
	taxonomies: Array<Taxonomy>;
};

export type StandOff = {
	listPerson?: Array<Person>;
};

export type State = {
	"@type": string;
	desc: XmlTextNode;
};

export type Birth = {
	date?: BirthDate;
	placeName?: XmlTextNode;
};

export type BirthDate = {
	"@notBefore"?: string;
	"@notAfter"?: string;
	$?: string;
	"@when"?: string;
};
