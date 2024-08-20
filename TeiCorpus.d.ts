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
	titles?: Array<TitlesEntity>;
	author?: Author;
	editor?: Editor;
	respStmts?: Array<RespStmtsEntity>;
	funder?: Funder;
}
export interface TitlesEntity {
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
export interface RespStmtsEntity {
	persName: PersName;
	resp: XmlTextNode;
}
export interface PersName {
	"@ref"?: string;
	forename: XmlTextNode;
	surname: XmlTextNode;
}
export interface XmlTextNode {
	$: string;
}
export interface TeiTeiTypedTarget {
	"@ref": string;
	$: string;
}
export interface IdnoOrNationalityOrNameOrTitlesEntity {
	"@type": string;
	$: string;
}
export interface PublicationStmt {
	pubPlace?: XmlTextNode;
	date: Date;
	availability: Availability;
	publishers?: Array<PublishersEntity>;
	distributor?: TeiTypedTarget;
	address?: Address;
	idno?: IdnoOrNationalityOrNameOrTitlesEntity;
}
export interface Date {
	$?: string;
	"@when"?: string;
	"@type"?: string;
	"@from"?: string;
	"@to"?: string;
	note: XmlTextNode;
}
export interface Availability {
	"@status": string;
	p?: P;
	licence?: TeiTypedTarget;
}
export interface TeiTypedTarget {
	"@type"?: string;
	"@target": string;
	$?: string;
}
export interface PublishersEntity {
	$: string;
	"@ref"?: string;
}
export interface Address {
	addrLine: XmlTextNode;
}
export interface SourceDesc {
	p?: XmlTextNode2;
	listBibl?: ListBibl;
	recordingStmt?: RecordingStmt;
}
export interface XmlTextNode2 {
	$: string;
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
	date: Date;
	respStmt: RespStmt;
	media: Media;
}
export interface RespStmt {
	resp: XmlTextNode;
	persName: TeiTeiTypedTarget;
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
	tagsDecl?: TagsDecl;
	projectDesc?: SourceDescOrProjectDescOrEditorialDecl;
	editorialDecl?: SourceDescOrProjectDescOrEditorialDecl;
	listPrefixDef?: Array<ListPrefixDefEntity>;
}
export interface TagsDecl {
	"@partial"?: string;
	renditions?: Array<RenditionsEntity>;
	namespace?: Namespace;
}
export interface RenditionsEntity {
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
export interface ListPrefixDefEntity {
	"@ident": string;
	"@matchPattern": string;
	"@replacementPattern": string;
	p: P;
}
export interface P {
	code: XmlTextNode;
	ref?: TeiTypedTarget;
	$: string;
	att?: XmlTextNode;
	gi?: XmlTextNode;
}
export interface XmlTextNode3 {
	$: string;
}
export interface XmlTextNode4 {
	$: string;
}
export interface ProfileDesc {
	langUsage?: LangUsage;
	textDesc?: TextDesc;
	particDesc?: ParticDesc;
	settingDesc?: SettingDesc;
	textClass?: TextClass;
}
export interface LangUsage {
	language: Language;
}
export interface Language {
	"@ident": string;
	"@type": string;
	name: IdnoOrNationalityOrNameOrTitlesEntity;
	place: Place;
	date: Date;
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
	idno?: IdnoOrNationalityOrNameOrTitlesEntity;
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
	nationality: IdnoOrNationalityOrNameOrTitlesEntity;
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
	name?: IdnoOrNationalityOrNameOrTitlesEntity;
	persName?: PersName;
	sex?: XmlTextNode;
	birth?: XmlTextNode;
	note?: XmlTextNode;
	state?: State;
	idno?: Idno;
	affiliation?: XmlTextNode;
}
export interface SettingDesc {
	place: Place;
}
export interface TextClass {
	catRef?: TeiTypedTarget;
}
export interface RevisionDesc {
	changes?: Array<ChangesEntity>;
}
export interface ChangesEntity {
	"@n"?: string;
	"@who": string;
	"@when": string;
	$: string;
}
export interface Funder {
	orgName: TeiTeiTypedTarget;
	idno: IdnoOrNationalityOrNameOrTitlesEntity;
	$: string;
}
export interface LicenceOrTeiTypedTarget {
	"@target": string;
	$: string;
}
export interface P2 {
	ptr: TeiTypedTarget;
	$: string;
}
export interface ClassDecl {
	taxonomy: Taxonomy;
}
export interface Taxonomy {
	categories?: Array<CategoriesEntity>;
}
export interface CategoriesEntity {
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
export interface Idno {
	"@type": string;
	"@subtype": string;
	$: string;
}
