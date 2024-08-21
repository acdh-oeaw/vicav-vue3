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
	fileDesc: FileDesc;
	encodingDesc: EncodingDesc;
	profileDesc?: ProfileDesc;
	revisionDesc?: RevisionDesc;
	"@id"?: string;
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
	titles?: Array<Title>;
	author?: Author;
	editor?: Editor;
	respStmts: Array<RespStmt>;
	funder?: Funder;
}

export interface Title {
	$: string;
	"@type"?: string;
	"@level"?: string;
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

export interface RespStmt {
	persName: PersName | TeiTypedTarget;
	resp: XmlTextNode;
	name?: Author;
	author?: Author;
}

export interface PersName {
	"@ref"?: string;
	forename: XmlTextNode;
	surname: XmlTextNode;
}

export interface XmlTextNode {
	$: string;
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

export interface TeiTypedTarget {
	"@ref"?: string;
	"@type"?: string;
	"@subtype"?: string;
	"@target"?: string;
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
	listPrefixDef?: Array<ListPrefixDef>;
	tagsDecl?: TagsDecl;
	projectDesc?: SourceDescOrProjectDescOrEditorialDecl;
	editorialDecl?: SourceDescOrProjectDescOrEditorialDecl;
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
export interface ListPrefixDef {
	"@ident": string;
	"@matchPattern": string;
	"@replacementPattern": string;
	p?: P;
}

export interface P {
	ptr?: TeiTypedTarget;
	code?: XmlTextNode;
	ref?: TeiTypedTarget;
	$: string;
	att?: XmlTextNode;
	gi?: XmlTextNode;
}

export interface ProfileDesc {
	langUsage?: LangUsage;
	textDesc?: TextDesc;
	particDesc?: ParticDesc;
	textClass?: TextClass;
	settingDesc?: SettingDesc;
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

export interface Place {
	"@type"?: string;
	"@id"?: string;
	"@sameAs"?: string;
	placeName: XmlTextNode;
	location?: Location;
	idno?: TeiTypedTarget;
	note?: XmlTextNode;
}

export interface Location {
	"@type"?: string;
	geo: Geo;
	country: Country;
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
	listPerson?: Array<Person>;
}

export interface Person {
	"@sameAs"?: string;
	"@id"?: string;
	name?: TeiTypedTarget;
	persName?: PersName;
	sex?: XmlTextNode;
	birth?: Birth | XmlTextNode;
	note?: XmlTextNode;
	state?: State;
	idno?: Idno;
	affiliation?: XmlTextNode;
}

export interface SettingDesc {
	setting?: Setting;
	place?: Place;
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

export interface Taxonomy {
	categories?: Array<Category>;
}

export interface Category {
	"@id": string;
	"@n": string;
	catDesc: XmlTextNode;
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
