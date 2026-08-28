import type { ReadonlyDeep } from "type-fest";
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
		label: "Audio available",
		getValue: (item) => item.audioAvailability,
		filterable: true,
		sortable: true,
	},
	"@hasTEIw": {
		key: "@hasTEIw",
		label: "Transcription available",
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

function isAuthor(item: Author | AuthorRef | undefined): item is Author {
	return Object.prototype.hasOwnProperty.call(item, "@id");
}

function isAuthorRef(item: Author | AuthorRef | string | undefined): item is AuthorRef {
	return Object.prototype.hasOwnProperty.call(item, "@ref");
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

function parseTeisForCorpusItem(item: TeiCorpus, itemIndex: number): Array<Promise<Array<TEI>>> {
	return (item.TEIs ?? []).map(async (tei, teiIndex) => {
		const parsedTei = await TeiSchema.safeParseAsync(tei);

		if (parsedTei.success) {
			return [parsedTei.data];
		}

		logInvalidTeiItem(item, tei, itemIndex, teiIndex, parsedTei.error);

		return [];
	});
}

async function parseCorpusItem(item: TeiCorpus, itemIndex: number): Promise<Array<TeiCorpus>> {
	const parsedCorpus = await TeiCorpusSchema.safeParseAsync(item);

	if (!parsedCorpus.success) {
		logInvalidCorpusItem(item, itemIndex, parsedCorpus.error);
		return [];
	}

	return [
		{
			...parsedCorpus.data,
			TEIs: (await Promise.all(parseTeisForCorpusItem(parsedCorpus.data, itemIndex))).flat(),
		},
	];
}

function parseRawItems(table: Array<unknown>): Array<Promise<Array<TeiCorpus>>> {
	return table.map((item, itemIndex) => {
		if (!isTeiCorpus(item)) return Promise.resolve([]);

		const parsedCorpus = parseCorpusItem(item, itemIndex);

		return parsedCorpus;
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

function resolveAuthorFromRespStmt(respStmt: RespStmt | undefined) {
	return respStmt && isAuthor(respStmt.persName) ? respStmt.persName : undefined;
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
		return isAuthorRef(persName) ? persName["@ref"].replace("corpus:", "") : "";
	}

	const matchingRespStmt = corpusMetadata.fileDesc.titleStmt.respStmts?.find((respStmt) => {
		return (
			isAuthorRef(respStmt.persName) &&
			isAuthorRef(persName) &&
			respStmt.persName["@ref"] === persName["@ref"]
		);
	});
	const matchingAuthor = resolveAuthorFromRespStmt(matchingRespStmt);

	return isAuthorRef(persName)
		? (resolveAuthorDisplayName(matchingAuthor) ?? persName["@ref"].replace("corpus:", ""))
		: "";
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
			isAuthorRef(itemRespStmt.persName) &&
			isAuthorRef(corpusRespStmt.persName) &&
			itemRespStmt.persName["@ref"] === corpusRespStmt.persName["@ref"]
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

interface CacheEntry {
	rawItems: Array<TeiCorpus>;
	simpleItems: Array<simpleTEIMetadata>;
	persons: Array<Person>;
}

type FrozenCacheEntry = ReadonlyDeep<CacheEntry>;

/**
 * Upper bound for the module-scope parsed-corpus memo. In steady state only the current upstream
 * deployment's ETag is live; the headroom covers rolling deploys without retaining unbounded
 * multi-generation corpora in long-running Node worker processes.
 */
const PARSED_CORPUS_CACHE_CAP = 4;

/**
 * Memo of fully parsed corpora keyed on the body-level `ETag` of the `/vicav/project` response,
 * which changes only when the upstream body changes. Module scope on purpose: Pinia stores are
 * recreated per SSR request, so only module state survives across requests in the same Node
 * process. Entries are shared by reference across concurrent requests; they are `markRaw`'d and
 * deeply frozen at write time (see `setCachedParsedCorpus`) to keep that sharing safe.
 */
const parsedCorpusByEtag = new Map<string, FrozenCacheEntry>();

/**
 * In-flight parse promises keyed on ETag. Distinct from the memo above in scope, lifetime, and
 * purpose: this is a short-lived dedup structure that only ever holds ETags currently being parsed
 * (most importantly right after a deploy, when many concurrent SSR requests would otherwise each
 * run the full parse pipeline for the same new ETag) and is empty the rest of the time.
 */
const inFlightParses = new Map<string, Promise<FrozenCacheEntry>>();

let hasWarnedMissingEtag = false;

/**
 * Recursively freezes every nested object and array. Skips already frozen subtrees (cache entries
 * share references — `persons` points into the `rawItems` corpus tree and every
 * `simpleTEIMetadata.teiHeader` is embedded by reference) and guards against circular references.
 */
function deepFreeze(value: unknown, seen = new WeakSet<object>()): void {
	if (typeof value !== "object" || value === null || seen.has(value) || Object.isFrozen(value)) {
		return;
	}

	seen.add(value);

	for (const nestedValue of Object.values(value)) {
		deepFreeze(nestedValue, seen);
	}

	Object.freeze(value);
}

function getCachedParsedCorpus(etag: string): FrozenCacheEntry | undefined {
	const cached = parsedCorpusByEtag.get(etag);
	if (!cached) return undefined;

	// Move the entry to the most-recent position so the cap evicts the least recently used ETag.
	parsedCorpusByEtag.delete(etag);
	parsedCorpusByEtag.set(etag, cached);

	return cached;
}

/**
 * Stores a freshly parsed corpus in the memo. `markRaw` must run before `deepFreeze`: it defines
 * the non-enumerable `__v_skip` property, which would throw on an already frozen (non-extensible)
 * object. Without it, every SSR request assigning the shared arrays into a `ref` would wrap — and
 * share — the same reactive Proxy. The deep freeze then turns "no consumer mutates this data" from
 * convention into a language-enforced invariant, which is required now that entries are shared by
 * reference across unrelated concurrent SSR requests.
 */
function setCachedParsedCorpus(etag: string, entry: CacheEntry): FrozenCacheEntry {
	markRaw(entry.rawItems);
	markRaw(entry.simpleItems);
	markRaw(entry.persons);
	deepFreeze(entry.rawItems);
	deepFreeze(entry.simpleItems);
	deepFreeze(entry.persons);

	const frozenEntry: FrozenCacheEntry = entry;
	parsedCorpusByEtag.delete(etag);
	parsedCorpusByEtag.set(etag, frozenEntry);

	if (parsedCorpusByEtag.size > PARSED_CORPUS_CACHE_CAP) {
		const oldestEtag = parsedCorpusByEtag.keys().next().value;
		if (oldestEtag !== undefined) parsedCorpusByEtag.delete(oldestEtag);
	}

	return frozenEntry;
}

/**
 * Runs the full validation and metadata build pipeline for a project static-data table.
 */
async function buildCacheEntry(staticDataTable: Array<unknown>): Promise<CacheEntry> {
	const parsedRawItems = (await Promise.all(parseRawItems(staticDataTable))).flat();

	return {
		rawItems: parsedRawItems,
		simpleItems: buildSimpleItems(parsedRawItems, parseGeoItems(staticDataTable)),
		persons: extractPersonList(findCorpusMetadata(parsedRawItems)),
	};
}

export const useTeiHeadersStore = defineStore("use-tei-headers-store", () => {
	const { data: projectData, suspense } = useProjectInfo();
	const rawItems = ref<Array<TeiCorpus>>([]);
	const simpleItems = ref<Array<simpleTEIMetadata>>([]);
	const persons = ref<Array<Person>>([]);
	let inFlight: Promise<void> | null = null;

	/**
	 * Assigns a (frozen) memo entry to the reactive refs. The assertions back to the mutable types
	 * are intentional: the public ref types stay unchanged, while the immutability guarantee holds
	 * at runtime via the deep freeze applied at cache write time.
	 */
	function assignCacheEntry(entry: FrozenCacheEntry): void {
		rawItems.value = entry.rawItems as Array<TeiCorpus>;
		simpleItems.value = entry.simpleItems as Array<simpleTEIMetadata>;
		persons.value = entry.persons as Array<Person>;
	}

	/**
	 * Initializes the TEI header cache once from project static data.
	 */
	const initialize = async function () {
		if (inFlight) {
			await inFlight;
			return;
		}

		inFlight = (async () => {
			await suspense();

			const envelope = projectData.value;
			const etag = envelope?.ETag;

			if (etag) {
				const cached = getCachedParsedCorpus(etag);
				if (cached) {
					assignCacheEntry(cached);
					return;
				}

				const pendingParse = inFlightParses.get(etag);
				if (pendingParse) {
					assignCacheEntry(await pendingParse);
					return;
				}

				// Registered before awaiting, so concurrent SSR requests for the same new ETag
				// await this promise instead of each running the full parse pipeline.
				const parsePromise = (async () => {
					const staticDataTable = envelope.projectConfig?.staticData?.table ?? [];
					return setCachedParsedCorpus(etag, await buildCacheEntry(staticDataTable));
				})();
				inFlightParses.set(etag, parsePromise);

				try {
					assignCacheEntry(await parsePromise);
				} finally {
					inFlightParses.delete(etag);
				}

				return;
			}

			if (envelope && !hasWarnedMissingEtag) {
				hasWarnedMissingEtag = true;
				console.warn(
					"[use-tei-headers-store] Project response carries no ETag;" +
						" the parsed corpus is not memoized across requests.",
				);
			}

			const entry = await buildCacheEntry(envelope?.projectConfig?.staticData?.table ?? []);
			rawItems.value = entry.rawItems;
			simpleItems.value = entry.simpleItems;
			persons.value = entry.persons;
		})();

		try {
			await inFlight;
		} finally {
			// eslint-disable-next-line require-atomic-updates -- only writer; concurrent callers merely read and await `inFlight`
			inFlight = null;
		}
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
