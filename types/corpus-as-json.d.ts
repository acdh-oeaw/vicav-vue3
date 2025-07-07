export interface AnnotationDoc {
	doc: Doc;
}

export interface Doc {
	"@id": string;
	annotationBlocks: Array<AnnotationBlock>;
	listPrefixDef: ListPrefixDef;
}

export interface AnnotationBlock {
	"@id": string;
	"@start": string;
	"@end": string;
	u?: U;
	us?: Array<U>;
	spanGrp: SpanGrp;
}

export interface SpanGrp {
	"@type": Type;
	span: Span;
}

export enum Type {
	Translation = "Translation",
}

export interface Span {
	"@lang": SpanLang;
	"@target": string;
	"@id": string;
	$: string;
}

export enum SpanLang {
	En = "en",
}

export interface U {
	"@lang": WLang;
	"@id": string;
	"@who": Who;
	$$: Array<UClass>;
}

export interface UClass {
	w?: WClass;
	pc?: PC;
	media?: Media;
}

export interface Media {
	"@mimeType": MIMEType;
	"@url": string;
}

export enum MIMEType {
	AudioMp3 = "audio/mp3",
	AudioWav = "audio/wav",
}

export interface PC {
	"@id": string;
	$: Empty;
	"@join"?: Join;
}

export enum Empty {
	Ambitious = "”",
	Braggadocious = "…",
	Cunning = "!",
	Empty = ".",
	Fluffy = "–",
	Frisky = ":",
	Hilarious = "“",
	Indecent = "’",
	Indigo = ")",
	Magenta = "[",
	Mischievous = "]",
	Purple = ",",
	Sticky = "(",
	Tentacled = "?",
	The1 = "_",
}

export enum Join {
	Right = "right",
}

export interface WClass {
	"@id": string;
	"@msd"?: string;
	"@lang"?: WLang;
	"@lemmaRef"?: string;
	$?: string;
	pos?: Pos;
	number?: Number;
	person?: string;
	synRoot?: string;
	diaRoot?: string;
	"@join"?: Join;
	"@rend"?: Rend;
	gender?: Gender;
	subc?: InflectionType;
	inflectionType?: InflectionType;
	diaRootNew?: string;
	$$?: Array<W>;
}

export interface W {
	$?: string;
	gap?: Gap;
}

export interface Gap {
	"@reason": Reason;
}

export enum Reason {
	Inaudible = "inaudible",
}

export enum WLang {
	ArACMXShawiVicav = "ar-acm-x-shawi-vicav",
	Empty = "##",
	Lang = "###",
	LangArACMXShawiVicav = "*ar-acm-x-shawi-vicav",
	Tr = "*tr",
	TrXShawiVicav = "tr-x-shawi-vicav",
}

export enum Rend {
	WithDash = "withDash",
}

export enum Gender {
	Feminine = "feminine",
	FeminineMasculine = "feminine/masculine",
	Masculine = "masculine",
}

export enum InflectionType {
	I = "I",
	Iv = "IV",
	PluralNoun = "pluralNoun",
}

export enum Number {
	Plural = "plural",
	Singular = "singular",
}

export enum Pos {
	ActiveParticiple = "activeParticiple",
	Adjective = "adjective",
	Adverb = "adverb",
	Article = "article",
	Conjunction = "conjunction",
	DemonstrativeParticle = "demonstrativeParticle",
	DemonstrativePronoun = "demonstrativePronoun",
	DiscourseParticle = "discourseParticle",
	Indefinite = "indefinite",
	IndefinitePronoun = "indefinitePronoun",
	Interjection = "interjection",
	Interrogative = "interrogative",
	NegationParticle = "negationParticle",
	Noun = "noun",
	Numeral = "numeral",
	Particle = "particle",
	PassiveParticiple = "passiveParticiple",
	Preposition = "preposition",
	Pronoun = "pronoun",
	PronounSuffix = "pronounSuffix",
	Verb = "verb",
}

export enum Who {
	Default = "#default",
	Translation = "#Translation",
}

export interface ListPrefixDef {
	prefixDefs: Array<PrefixDef>;
}

export interface PrefixDef {
	"@ident": string;
	"@matchPattern": string;
	"@replacementPattern": string;
	p: PClass;
}

export interface PClass {
	$$: Array<P>;
}

export interface P {
	$?: string;
	code?: Att;
	ref?: Ref;
	att?: Att;
	gi?: Att;
}

export interface Att {
	$: string;
}

export interface Ref {
	"@target": string;
	$: string;
}
