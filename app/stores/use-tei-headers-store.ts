import * as z from "zod";

import dataTypes from "@/config/dataTypes.ts";
import {
	type Author,
	type AuthorRef,
	BiblStructType,
	type Person,
	Responsibility,
	type RespStmt,
	type Taxonomy,
	type TEI,
	type TeiCorpus,
	type TeiHeader,
	Unit,
} from "@/lib/api-client";
import { type simpleTEIMetadata, SimpleTEIMetadataSchema } from "@/types/teiCorpus.ts";

const TeiCorpusSchema = z.fromJSONSchema(useOpenapiSchema("TeiCorpus")) as z.ZodType<TeiCorpus>;
const TeiSchema = z.fromJSONSchema(useOpenapiSchema("TEI")) as z.ZodType<TEI>;
const AuthorRefSchema = z.fromJSONSchema(useOpenapiSchema("AuthorRef")) as z.ZodType<AuthorRef>;
const AuthorSchema = z.fromJSONSchema(useOpenapiSchema("Author")) as z.ZodType<Author>;

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
		id: item["@id"] ?? teiHeader?.fileDesc.publicationStmt.idno?.$ ?? "no_id",
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
		place: {
			settlement: placeSettlement,
			country: teiHeader?.profileDesc?.settingDesc?.place?.country?.$ ?? undefined,
			region: teiHeader?.profileDesc?.settingDesc?.place?.region?.$ ?? undefined,
		},
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

function buildSimpleItems(items: Array<TeiCorpus>): Array<simpleTEIMetadata> {
	const corpusMetadata = findCorpusMetadata(items);

	return items.flatMap((teiCorpus) => {
		return (teiCorpus.TEIs ?? []).flatMap((tei) => {
			const metadata = extractMetadata(tei, teiCorpus["@id"] ?? "", corpusMetadata);

			return metadata ? [metadata] : [];
		});
	});
}

export const useTeiHeadersStore = defineStore("use-tei-headers-store", () => {
	const { data: projectData, suspense } = useProjectInfo();
	const rawItems = ref<Array<TeiCorpus>>([]);
	const simpleItems = ref<Array<simpleTEIMetadata>>([]);
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

			const parsedRawItems = parseRawItems(
				projectData.value?.projectConfig?.staticData?.table ?? [],
			);

			rawItems.value = parsedRawItems;
			simpleItems.value = buildSimpleItems(parsedRawItems);
		})();

		await initializationPromise;
	};

	return {
		initialize,
		rawItems,
		simpleItems,
	};
});
