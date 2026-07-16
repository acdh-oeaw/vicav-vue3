import * as z from "zod";

import dataTypes from "@/config/dataTypes.ts";
import {
	type Author,
	type AuthorRef,
	BiblStructType,
	type GeoPlace,
	type Person,
	Responsibility,
	type RespStmt,
	type Taxonomy,
	type TEI,
	type TeiCorpus,
	type TeiHeader,
	Unit,
} from "@/lib/api-client";
import type { DataTypesEnum } from "@/types/global.ts";
import { type simpleTEIMetadata, SimpleTEIMetadataSchema } from "@/types/teiCorpus.ts";

const TeiCorpusSchema = z.fromJSONSchema(useOpenapiSchema("TeiCorpus")) as z.ZodType<TeiCorpus>;
const TeiSchema = z.fromJSONSchema(useOpenapiSchema("TEI")) as z.ZodType<TEI>;
const AuthorRefSchema = z.fromJSONSchema(useOpenapiSchema("AuthorRef")) as z.ZodType<AuthorRef>;
const AuthorSchema = z.fromJSONSchema(useOpenapiSchema("Author")) as z.ZodType<Author>;
const GeoPlaceSchema = z.fromJSONSchema(useOpenapiSchema("GeoPlace")) as z.ZodType<GeoPlace>;

const supportedResponsibilities = [
	Responsibility.Author,
	Responsibility.Recording,
	Responsibility.Principal2,
	Responsibility.Transcription1,
	Responsibility.TransferToELAN,
] as const satisfies Array<Responsibility>;

interface ObjectWithID {
	"@id": string;
}

type ResponsibilityPeople = Partial<
	Record<Responsibility, Array<{ given: string; family: string }>>
>;
type PublicationMetadata = simpleTEIMetadata["publication"];
type PlaceMetadata = simpleTEIMetadata["place"];
interface GeoPlaceSource {
	text: { body: { listPlace: Array<GeoPlace> } };
}
export type GroupedSimpleItemsByDataType = Partial<Record<DataTypesEnum, Array<simpleTEIMetadata>>>;
export type GroupedSimpleItemsByPlace = Record<string, GroupedSimpleItemsByDataType>;
export type GroupedSimpleItemsByRegion = Record<string, GroupedSimpleItemsByPlace>;
export type GroupedSimpleItemsByCountry = Record<string, GroupedSimpleItemsByRegion>;
export type SimpleMetadataAccessorKey =
	| "id"
	| "label"
	| "title"
	| "dataType"
	| "category"
	| "recordingDate"
	| "resp"
	| "duration"
	| "audioAvailability"
	| "@hasTEIw"
	| "country"
	| "region"
	| "settlement";

export interface SimpleMetadataAccessor {
	key: SimpleMetadataAccessorKey;
	label: string;
	getValue: (item: simpleTEIMetadata) => string;
	filterable?: boolean;
	groupable?: boolean;
	sortable?: boolean;
}

export interface GroupSimpleItemsOptions {
	dataTypes: Array<DataTypesEnum>;
	filterListBy?: { key: SimpleMetadataAccessorKey; value: string };
	sort?: (a: simpleTEIMetadata, b: simpleTEIMetadata) => number;
}

const labelCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
export const simpleMetadataAccessors = {
	id: {
		key: "id",
		label: "ID",
		getValue: (item) => item.id,
		filterable: false,
		sortable: true,
	},
	label: {
		key: "label",
		label: "Title",
		getValue: (item) => item.label,
		filterable: true,
		sortable: true,
	},
	title: {
		key: "title",
		label: "Title",
		getValue: (item) => item.title,
		filterable: true,
		sortable: true,
	},
	dataType: {
		key: "dataType",
		label: "Data type",
		getValue: (item) => item.dataType,
		filterable: true,
		sortable: true,
	},
	category: {
		key: "category",
		label: "Category",
		getValue: (item) => item.category,
		filterable: true,
		sortable: true,
	},
	recordingDate: {
		key: "recordingDate",
		label: "Recording date",
		getValue: (item) => {
			if (typeof item.recordingDate === "string") return item.recordingDate;
			return item.recordingDate?.["@when"] ?? item.recordingDate?.$ ?? "";
		},
		filterable: false,
		sortable: true,
	},
	resp: {
		key: "resp",
		label: "Interviewer",
		getValue: (item) => item.resp,
		filterable: true,
		sortable: true,
	},
	duration: {
		key: "duration",
		label: "Duration",
		getValue: (item) => item.duration ?? "",
		filterable: false,
		sortable: true,
	},
	audioAvailability: {
		key: "audioAvailability",
		label: "Audio",
		getValue: (item) => item.audioAvailability,
		filterable: true,
		sortable: true,
	},
	"@hasTEIw": {
		key: "@hasTEIw",
		label: "TEI",
		getValue: (item) => item["@hasTEIw"],
		filterable: true,
		sortable: true,
	},
	country: {
		key: "country",
		label: "Country",
		getValue: (item) => item.place.country ?? "",
		filterable: true,
		groupable: true,
		sortable: true,
	},
	region: {
		key: "region",
		label: "Region",
		getValue: (item) => item.place.region ?? "",
		filterable: true,
		groupable: true,
		sortable: true,
	},
	settlement: {
		key: "settlement",
		label: "Place",
		getValue: (item) => item.place.settlement ?? "",
		filterable: true,
		groupable: true,
		sortable: true,
	},
} as const satisfies Record<SimpleMetadataAccessorKey, SimpleMetadataAccessor>;

function hasIDAttribute(item: unknown): item is ObjectWithID {
	return Object.prototype.hasOwnProperty.call(item, "@id");
}

function isTeiCorpus(item: unknown): item is TeiCorpus {
	return Object.prototype.hasOwnProperty.call(item, "TEIs");
}

function logInvalidCorpusItem(item: unknown, itemIndex: number, error: z.ZodError): void {
	if (hasIDAttribute(item)) {
		console.error(`Error parsing item ${itemIndex.toString()} with @id: ${item["@id"]}`);
	} else {
		console.error("Error parsing item without @id attribute");
	}

	console.error(error);
}

function logInvalidTeiItem(
	parsedCorpus: TeiCorpus,
	tei: unknown,
	itemIndex: number,
	teiIndex: number,
	error: z.ZodError,
): void {
	if (hasIDAttribute(parsedCorpus)) {
		console.error(`Error parsing item ${itemIndex.toString()} with @id: ${parsedCorpus["@id"]}`);
	}

	if (hasIDAttribute(tei)) {
		console.error(`Error parsing TEIs[${teiIndex.toString()}] with @id: ${tei["@id"]}`);
	} else {
		console.error(`Error parsing TEIs[${teiIndex.toString()}] without @id attribute`);
	}

	console.error(error);
}

function parseTeisForCorpusItem(item: TeiCorpus, itemIndex: number): Array<TEI> {
	return (item.TEIs ?? []).flatMap((tei, teiIndex) => {
		const parsedTei = TeiSchema.safeParse(tei);

		if (parsedTei.success) {
			return [parsedTei.data];
		}

		logInvalidTeiItem(item, tei, itemIndex, teiIndex, parsedTei.error);

		return [];
	});
}

function parseCorpusItem(item: TeiCorpus, itemIndex: number): TeiCorpus | null {
	const parsedCorpus = TeiCorpusSchema.safeParse(item);

	if (!parsedCorpus.success) {
		logInvalidCorpusItem(item, itemIndex, parsedCorpus.error);
		return null;
	}

	return {
		...parsedCorpus.data,
		TEIs: parseTeisForCorpusItem(parsedCorpus.data, itemIndex),
	};
}

function parseRawItems(table: Array<unknown>): Array<TeiCorpus> {
	return table.flatMap((item, itemIndex) => {
		if (!isTeiCorpus(item)) return [];

		const parsedCorpus = parseCorpusItem(item, itemIndex);

		return parsedCorpus ? [parsedCorpus] : [];
	});
}

function getRecordProperty(value: unknown, key: string): unknown {
	if (!value || typeof value !== "object") return undefined;

	return (value as Record<string, unknown>)[key];
}

function parseGeoItems(table: Array<unknown>): Array<GeoPlaceSource> {
	return table.flatMap((item) => {
		const itemRecord = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
		const candidates = [item, itemRecord.Geo, itemRecord.TEI].filter(Boolean);

		for (const candidate of candidates) {
			const text = getRecordProperty(candidate, "text");
			const body = getRecordProperty(text, "body");
			const listPlace = getRecordProperty(body, "listPlace");

			if (!Array.isArray(listPlace)) continue;

			const places = listPlace.flatMap((place) => {
				const parsedPlace = GeoPlaceSchema.safeParse(place);

				return parsedPlace.success ? [parsedPlace.data] : [];
			});

			if (places.length > 0) return [{ text: { body: { listPlace: places } } }];
		}

		return [];
	});
}

function resolveDataType(dataTypeCollection: string): string {
	const matchedDataType = Object.values(dataTypes).find(
		(dataTypeObject) => dataTypeObject.collection === dataTypeCollection,
	);

	return matchedDataType ? matchedDataType.targetType : "Text";
}

function parseDurationInSeconds(item: TEI): number | undefined {
	const durationIso = item.teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording["@dur-iso"];

	if (!durationIso) return undefined;

	return Number.parseInt(durationIso.replace("PT", "").replace(".0", ""), 10);
}

function formatDuration(durationInSeconds: number | undefined): string | undefined {
	if (!durationInSeconds) return undefined;

	const hours = Math.floor(durationInSeconds / 3600);
	const seconds = Math.floor(durationInSeconds % 60);
	const minutes = Math.floor((durationInSeconds % 3600) / 60);

	return `${hours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(
		2,
		"0",
	)}:${String(seconds).padStart(2, "0")}`;
}

function resolveAuthorReference(value: unknown): string | undefined {
	return AuthorRefSchema.safeParse(value).data?.["@ref"];
}

function resolveAuthorFromRespStmt(respStmt: RespStmt | undefined): Author | undefined {
	return respStmt ? AuthorSchema.safeParse(respStmt.persName).data : undefined;
}

function resolveAuthorDisplayName(author: Author | undefined): string | undefined {
	if (author?.forename && author.surname) {
		return `${author.forename.$} ${author.surname.$}`;
	}

	return author?.name?.$;
}

function resolveRecordingResponsibilityName(
	item: TEI,
	corpusMetadata: TeiHeader | undefined,
): string {
	const recording = item.teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording;
	const persName = recording?.respStmt?.persName ?? recording?.p?.$ ?? "Recording record malformed";

	if (!corpusMetadata) {
		return resolveAuthorReference(persName)?.replace("corpus:", "") ?? "";
	}

	const matchingRespStmt = corpusMetadata.fileDesc.titleStmt.respStmts?.find((respStmt) => {
		return resolveAuthorReference(respStmt.persName) === resolveAuthorReference(persName);
	});
	const matchingAuthor = resolveAuthorFromRespStmt(matchingRespStmt);

	return (
		resolveAuthorDisplayName(matchingAuthor) ??
		resolveAuthorReference(persName)?.replace("corpus:", "") ??
		""
	);
}

function resolvePlaceSettlement(item: TEI): string | undefined {
	const place = item.teiHeader?.profileDesc?.settingDesc?.place;

	if (place?.placeName?.$) return place.placeName.$;

	const firstSettlementName = place?.settlement?.name.at(0);
	if (firstSettlementName?.$) return firstSettlementName.$;

	return place?.settlement?.name.find((name) => name["@lang"] === "en")?.$;
}

function normalizeGeoReference(reference: string): string {
	return reference
		.trim()
		.replace(/^geo:/i, "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\s_-]+/g, "")
		.toLowerCase();
}

function resolveGeoPlaceName(place: GeoPlace): string | undefined {
	return place.prefLabel_placeName.$ ?? place.standard_placeName?.$ ?? place.local_placeName?.$;
}

function buildGeoPlaceMetadata(place: GeoPlace): PlaceMetadata {
	const placeName = resolveGeoPlaceName(place);
	const hierarchyKey = place["@type"] === "reg" ? "region" : "settlement";

	return {
		[hierarchyKey]: placeName,
		country: place.location.country.$,
	};
}

function buildGeoPlaceIndex(geoItems: Array<GeoPlaceSource> = []): Map<string, PlaceMetadata> {
	const geoPlaceIndex = new Map<string, PlaceMetadata>();

	for (const geoItem of geoItems) {
		for (const place of geoItem.text.body.listPlace) {
			const placeMetadata = buildGeoPlaceMetadata(place);
			const references = [
				place["@id"],
				resolveGeoPlaceName(place),
				place.standard_placeName?.$,
				place.local_placeName?.$,
				place.geoNames_idno.$,
			].filter((reference): reference is string => Boolean(reference));

			for (const reference of references) {
				geoPlaceIndex.set(normalizeGeoReference(reference), placeMetadata);
			}
		}
	}

	return geoPlaceIndex;
}

function resolveGeoPlaceMetadata(
	item: TEI,
	geoPlaceIndex: Map<string, PlaceMetadata>,
): PlaceMetadata {
	const directPlaceReference = item.teiHeader?.profileDesc?.settingDesc?.place?.["@sameAs"];
	const settingPlaceReference =
		item.teiHeader?.profileDesc?.settingDesc?.setting?.placeName?.["@sameAs"];
	const languagePlaceReference =
		item.teiHeader?.profileDesc?.langUsage?.language?.settingDesc?.listPlace?.place?.["@sameAs"];
	const references = [directPlaceReference, settingPlaceReference, languagePlaceReference].filter(
		(reference): reference is string => Boolean(reference),
	);

	for (const reference of references) {
		const placeMetadata = geoPlaceIndex.get(normalizeGeoReference(reference));
		if (placeMetadata) return placeMetadata;
	}

	return {};
}

function resolvePlaceMetadata(
	item: TEI,
	placeSettlement: string | undefined,
	geoPlaceIndex: Map<string, PlaceMetadata>,
): PlaceMetadata {
	const teiPlace = item.teiHeader?.profileDesc?.settingDesc?.place;
	const geoPlace = resolveGeoPlaceMetadata(item, geoPlaceIndex);

	return {
		settlement: placeSettlement ?? geoPlace.settlement,
		country: teiPlace?.country?.$ ?? geoPlace.country,
		region: teiPlace?.region?.$ ?? geoPlace.region,
	};
}

function buildSimplePerson(person: Person) {
	return {
		name: person["@id"] ?? "",
		sex: person["@sex"] ?? person.sex?.$ ?? "n/a",
		age: person["@age"] ?? "n/a",
		dob: person.birth?.$ ?? person.birth?.date?.$ ?? "n/a",
	};
}

function extractPersons(
	item: TEI,
	corpusMetadata: TeiHeader | undefined,
): Array<simpleTEIMetadata["person"][number]> {
	const corpusPersons = corpusMetadata?.profileDesc?.particDesc?.listPerson;
	const teiPersons = item.teiHeader?.profileDesc?.particDesc?.listPerson;

	if (!corpusPersons || !teiPersons) return [];

	const referencedPersonIds = teiPersons
		.map((person) => (person["@sameAs"] ?? person.$ ?? "").replace("corpus:", ""))
		.filter(Boolean);

	return referencedPersonIds.flatMap((personId) => {
		const matchingPerson = corpusPersons.find((person) => person["@id"] === personId);

		return matchingPerson ? [buildSimplePerson(matchingPerson)] : [];
	});
}

function extractPersonList(corpusMetadata: TeiHeader | undefined): Array<Person> {
	return corpusMetadata?.profileDesc?.particDesc?.listPerson ?? [];
}

function resolveResponsiblePeople(
	itemRespStmt: RespStmt,
	corpusMetadata: TeiHeader,
): { given: string; family: string } {
	const matchingRespStmt = corpusMetadata.fileDesc.titleStmt.respStmts?.find((corpusRespStmt) => {
		return (
			resolveAuthorReference(itemRespStmt.persName) ===
			resolveAuthorReference(corpusRespStmt.persName)
		);
	});
	const author = resolveAuthorFromRespStmt(matchingRespStmt);

	if (author?.forename && author.surname) {
		return { given: author.forename.$, family: author.surname.$ };
	}

	if (author?.name?.$) {
		return { given: author.name.$, family: "" };
	}

	return { family: "", given: "" };
}

function buildResponsibilityData(
	item: TEI,
	corpusMetadata: TeiHeader | undefined,
): ResponsibilityPeople {
	const respStmts = item.teiHeader?.fileDesc.titleStmt.respStmts;

	if (!respStmts || !corpusMetadata) return {};

	return supportedResponsibilities.reduce<ResponsibilityPeople>(
		(responsibilityData, responsibility) => {
			const matchingRespStmts = respStmts.filter((respStmt) => respStmt.resp.$ === responsibility);

			if (matchingRespStmts.length === 0) {
				return responsibilityData;
			}

			return {
				...responsibilityData,
				[responsibility]: matchingRespStmts.map((respStmt) =>
					resolveResponsiblePeople(respStmt, corpusMetadata),
				),
			};
		},
		{},
	);
}

function createEmptyPublication(): PublicationMetadata {
	return {
		refType: "external",
		type: "",
		bibl: {
			author: [],
			title: "",
			issued: [],
		},
	};
}

function resolveBiblScopeValue(item: TEI, unit: Unit): string | undefined {
	return item.teiHeader?.fileDesc.sourceDesc.biblStruct?.monogr?.imprint.biblScopes?.find(
		(scope) => scope["@unit"] === unit,
	)?.$;
}

function buildBookSectionPublication(item: TEI): PublicationMetadata {
	const biblStruct = item.teiHeader!.fileDesc.sourceDesc.biblStruct!;

	return {
		refType: "external",
		type: "chapter",
		bibl: {
			"container-title": biblStruct.monogr?.title?.$,
			title: biblStruct.analytic?.title?.$ ?? "",
			author: [
				{
					given: biblStruct.analytic?.author?.forename?.$ ?? "",
					family: biblStruct.analytic?.author?.surname?.$ ?? "",
				},
			],
			editor: [
				{
					given: biblStruct.monogr?.editor?.forename?.$ ?? "",
					family: biblStruct.monogr?.editor?.surname?.$ ?? "",
				},
			],
			issued: [biblStruct.monogr?.imprint.date.$ ?? ""],
			publisherPlace: biblStruct.monogr?.imprint.pubPlace?.$,
			page: resolveBiblScopeValue(item, Unit.Page),
		},
	};
}

function buildJournalArticlePublication(item: TEI): PublicationMetadata {
	const biblStruct = item.teiHeader!.fileDesc.sourceDesc.biblStruct!;

	return {
		refType: "external",
		type: "journalArticle",
		bibl: {
			"container-title": biblStruct.monogr?.title?.$,
			title: biblStruct.analytic?.title?.$ ?? "",
			author: [
				{
					given: biblStruct.analytic?.author?.forename?.$ ?? "",
					family: biblStruct.analytic?.author?.surname?.$ ?? "",
				},
			],
			editor: [
				{
					given: biblStruct.monogr?.editor?.forename?.$ ?? "",
					family: biblStruct.monogr?.editor?.surname?.$ ?? "",
				},
			],
			issued: [biblStruct.monogr?.imprint.date.$ ?? ""],
			publisherPlace: biblStruct.monogr?.imprint.pubPlace?.$,
			volume: resolveBiblScopeValue(item, Unit.Volume),
			page: resolveBiblScopeValue(item, Unit.Page),
		},
	};
}

function buildThesisPublication(item: TEI): PublicationMetadata {
	const biblStruct = item.teiHeader!.fileDesc.sourceDesc.biblStruct!;

	return {
		refType: "external",
		type: "book",
		bibl: {
			title: biblStruct.monogr?.title?.$ ?? "",
			author: [
				{
					given: biblStruct.monogr?.author?.forename?.$ ?? "",
					family: biblStruct.monogr?.author?.surname?.$ ?? "",
				},
			],
			issued: [biblStruct.monogr?.imprint.date.$ ?? ""],
			publisherPlace: biblStruct.monogr?.imprint.pubPlace?.$,
		},
	};
}

function buildPublication(item: TEI): PublicationMetadata {
	const biblType = item.teiHeader?.fileDesc.sourceDesc.biblStruct?.["@type"];

	if (biblType === BiblStructType.BookSection) return buildBookSectionPublication(item);
	if (biblType === BiblStructType.JournalArticle) return buildJournalArticlePublication(item);
	if (biblType === BiblStructType.Thesis) return buildThesisPublication(item);

	return createEmptyPublication();
}

function mergeCorpusTaxonomies(corpusMetadata: TeiHeader | undefined): Taxonomy {
	return (
		corpusMetadata?.encodingDesc?.classDecl?.taxonomies.reduce<Taxonomy>(
			(mergedTaxonomy, taxonomy) => {
				return {
					categories: mergedTaxonomy.categories.concat(taxonomy.categories),
				};
			},
			{ categories: [] },
		) ?? { categories: [] }
	);
}

function resolveCategory(
	item: TEI,
	resolvedDataType: string,
	corpusMetadata: TeiHeader | undefined,
): string {
	if (resolvedDataType !== "CorpusText" || !corpusMetadata) return "";
	if (!item.teiHeader) return "Unknown";

	const firstCategoryReference = item.teiHeader.profileDesc?.textClass?.catRefs.at(0);
	const categoryTarget = firstCategoryReference ? firstCategoryReference["@target"] : undefined;
	const categoryId = categoryTarget ? categoryTarget.replace("corpus:", "") : undefined;
	const matchingCategory = mergeCorpusTaxonomies(corpusMetadata).categories.find(
		(category) => category["@id"] === categoryId,
	);

	if (matchingCategory?.catDesc.name?.$) return matchingCategory.catDesc.name.$;
	if (matchingCategory?.catDesc.$) return matchingCategory.catDesc.$;

	return "Unknown";
}

function resolveLabel(
	item: TEI,
	resolvedDataType: string,
	persons: Array<simpleTEIMetadata["person"][number]>,
	placeSettlement: string | undefined,
): string {
	const teiHeader = item.teiHeader;
	const title = teiHeader?.fileDesc.titleStmt.titles?.at(0)?.$;

	if (resolvedDataType === "CorpusText" && title) return title;
	if (persons.at(0)) return persons[0]!.name;
	if (title) return title;
	if (!persons.at(0)?.name) {
		return item["@id"] ?? teiHeader?.fileDesc.publicationStmt.idno?.$ ?? "no_id";
	}

	return placeSettlement ?? "";
}

function resolveTitle(
	item: TEI,
	label: string,
	persons: Array<simpleTEIMetadata["person"][number]>,
): string {
	const title = item.teiHeader?.fileDesc.titleStmt.titles?.at(0)?.$;

	if (!title) return label;
	if (!persons.at(0)?.name) return title;

	return `${title} – ${persons[0]!.name}`;
}

function resolveAudioAvailability(
	item: TEI,
	resolvedDataType: string,
	durationInSeconds: number | undefined,
): string {
	if (!durationInSeconds || resolvedDataType === "Feature" || resolvedDataType === "Profile") {
		return "restricted";
	}

	return item.teiHeader?.fileDesc.publicationStmt.availability?.["@status"] ?? "unknown";
}

function extractMetadata(
	item: TEI,
	dataTypeCollection: string,
	corpusMetadata: TeiHeader | undefined,
	geoPlaceIndex: Map<string, PlaceMetadata>,
): simpleTEIMetadata | null {
	const teiHeader = item.teiHeader;
	const resolvedDataType = resolveDataType(dataTypeCollection);
	const durationInSeconds = parseDurationInSeconds(item);
	const placeSettlement = resolvePlaceSettlement(item);
	const persons = extractPersons(item, corpusMetadata);
	const label = resolveLabel(item, resolvedDataType, persons, placeSettlement);
	const title = resolveTitle(item, label, persons);
	const responsibilityData = buildResponsibilityData(item, corpusMetadata);
	const parsedItem = SimpleTEIMetadataSchema.safeParse({
		// Note that there could be several idnos here. The one we need has a type ending in "CorpusID".
		// At the moment we only need to care about one idno.
		id: teiHeader?.fileDesc.publicationStmt.idno?.$ ?? item["@id"] ?? "no_id",
		recordingDate: teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording.date?.["@when"],
		pubDate: teiHeader?.fileDesc.publicationStmt.date?.$ ?? "unknown",
		dataType: resolvedDataType,
		label,
		title,
		author: responsibilityData.author ?? [],
		recording: responsibilityData.recording ?? [],
		principal: responsibilityData.principal ?? [],
		transcription: responsibilityData.transcription ?? [],
		"transfer to ELAN": responsibilityData["transfer to ELAN"] ?? [],
		place: resolvePlaceMetadata(item, placeSettlement, geoPlaceIndex),
		person: persons,
		resp:
			resolvedDataType === "CorpusText" &&
			!teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording.respStmt
				? "Unknown"
				: resolveRecordingResponsibilityName(item, corpusMetadata),
		category: resolveCategory(item, resolvedDataType, corpusMetadata),
		duration: formatDuration(durationInSeconds),
		audioAvailability: resolveAudioAvailability(item, resolvedDataType, durationInSeconds),
		"@hasTEIw": item["@hasTEIw"] === "true" ? "true" : "false",
		teiHeader,
		publication: buildPublication(item),
	});

	if (parsedItem.success) {
		return parsedItem.data;
	}

	return null;
}

function findCorpusMetadata(items: Array<TeiCorpus>): TeiHeader | undefined {
	return items.find((item) => item.teiHeader && item["@id"] === "vicav_corpus")?.teiHeader;
}

function buildSimpleItems(
	items: Array<TeiCorpus>,
	geoItems: Array<GeoPlaceSource> = [],
): Array<simpleTEIMetadata> {
	const corpusMetadata = findCorpusMetadata(items);
	const geoPlaceIndex = buildGeoPlaceIndex(geoItems);

	return items.flatMap((teiCorpus) => {
		return (teiCorpus.TEIs ?? []).flatMap((tei) => {
			const metadata = extractMetadata(tei, teiCorpus["@id"] ?? "", corpusMetadata, geoPlaceIndex);

			return metadata ? [metadata] : [];
		});
	});
}

export function getSimpleMetadataValue(
	item: simpleTEIMetadata,
	key: SimpleMetadataAccessorKey,
): string {
	return simpleMetadataAccessors[key].getValue(item);
}

function compareSimpleMetadataByLabel(a: simpleTEIMetadata, b: simpleTEIMetadata): number {
	return labelCollator.compare(a.label, b.label);
}

function sortRecordByKeys<T>(record: Record<string, T>): Record<string, T> {
	return Object.keys(record)
		.sort((a, b) => labelCollator.compare(a, b))
		.reduce<Record<string, T>>((sortedRecord, key) => {
			sortedRecord[key] = record[key]!;
			return sortedRecord;
		}, {});
}

export function groupSimpleItems(
	items: Array<simpleTEIMetadata>,
	options: GroupSimpleItemsOptions,
): GroupedSimpleItemsByCountry {
	const sort = options.sort ?? compareSimpleMetadataByLabel;
	const collectedItems = items
		.filter((item) => {
			const isAllowedDataType = options.dataTypes.includes(item.dataType);
			const matchesFilter =
				options.filterListBy === undefined ||
				getSimpleMetadataValue(item, options.filterListBy.key) === options.filterListBy.value;

			return isAllowedDataType && matchesFilter;
		})
		.toSorted(sort);
	const groupedItems = collectedItems.reduce<GroupedSimpleItemsByCountry>((grouped, item) => {
		const country = getSimpleMetadataValue(item, "country");
		const region = getSimpleMetadataValue(item, "region");
		const place = getSimpleMetadataValue(item, "settlement");
		const dataType = item.dataType;

		grouped[country] ??= {};
		grouped[country][region] ??= {};
		grouped[country][region][place] ??= {};
		grouped[country][region][place][dataType] ??= [];
		grouped[country][region][place][dataType].push(item);

		return grouped;
	}, {});

	return sortRecordByKeys(
		Object.fromEntries(
			Object.entries(groupedItems).map(([country, itemsByRegion]) => {
				return [
					country,
					sortRecordByKeys(
						Object.fromEntries(
							Object.entries(itemsByRegion).map(([region, itemsByPlace]) => {
								return [
									region,
									sortRecordByKeys(
										Object.fromEntries(
											Object.entries(itemsByPlace).map(([place, itemsByDataType]) => {
												return [place, sortRecordByKeys(itemsByDataType)];
											}),
										),
									),
								];
							}),
						),
					),
				];
			}),
		),
	);
}

export const useTeiHeadersStore = defineStore("use-tei-headers-store", () => {
	const { data: projectData, suspense } = useProjectInfo();
	const rawItems = ref<Array<TeiCorpus>>([]);
	const simpleItems = ref<Array<simpleTEIMetadata>>([]);
	const persons = ref<Array<Person>>([]);
	let initializationPromise: Promise<void> | null = null;

	/**
	 * Initializes the TEI header cache once from project static data.
	 */
	const initialize = async function () {
		if (initializationPromise) {
			await initializationPromise;
			return;
		}

		initializationPromise = (async () => {
			await suspense();

			const staticDataTable = projectData.value?.projectConfig?.staticData?.table ?? [];
			const parsedRawItems = parseRawItems(staticDataTable);

			rawItems.value = parsedRawItems;
			simpleItems.value = buildSimpleItems(parsedRawItems, parseGeoItems(staticDataTable));
			persons.value = extractPersonList(findCorpusMetadata(rawItems.value));
		})();

		await initializationPromise;
	};

	function getGroupedSimpleItems(options: GroupSimpleItemsOptions): GroupedSimpleItemsByCountry {
		return groupSimpleItems(simpleItems.value, options);
	}

	return {
		initialize,
		rawItems,
		simpleItems,
		persons,
		getGroupedSimpleItems,
	};
});
