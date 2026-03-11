import { computed, type ComputedRef } from "vue";
import * as z from "zod";

import dataTypes from "@/config/dataTypes.ts";
import {
	type Author,
	type AuthorRef,
	BiblStructType,
	type Person,
	type Responsibility,
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

interface ObjectWithID {
	"@id": string;
}

function hasIDAttribute(item: unknown): item is ObjectWithID {
	return Object.prototype.hasOwnProperty.call(item, "@id");
}

function isTeiCorpus(item: unknown): item is TeiCorpus {
	return Object.prototype.hasOwnProperty.call(item, "TEIs");
}

export const useTeiHeadersStore = defineStore("use-tei-headers-store", () => {
	const { data: projectData, suspense } = useProjectInfo();

	const initialize = async () => {
		await suspense();
	};

	const rawItems = computed((previousParsedItems: Array<TeiCorpus> | undefined) => {
		// Why is this computed serveral times?
		if (previousParsedItems) return previousParsedItems;
		const parsedItems: Array<TeiCorpus> = [];
		(projectData.value?.projectConfig?.staticData?.table ?? []).forEach((item, itemIndex) => {
			if (!isTeiCorpus(item)) return;
			const TEIs = item.TEIs ?? [];
			// We want to check the teiCorpus teiHeader first and throw away all the data if that is
			// invalid.
			const parsedItem = TeiCorpusSchema.safeParse(item);
			if (parsedItem.success) {
				parsedItem.data.TEIs = [];
				// We need to parse the TEIs one by one to get more detailed error messages about which TEI
				// at which position is not valid and why
				TEIs.forEach((tei, teiIndex) => {
					const parsedTEI = TeiSchema.safeParse(tei);
					if (parsedTEI.success) {
						parsedItem.data.TEIs?.push(parsedTEI.data);
					} else {
						if (hasIDAttribute(parsedItem.data)) {
							console.log(
								`Error parsing item ${itemIndex.toString()} with @id: ${parsedItem.data["@id"]}`,
							);
						}
						if (hasIDAttribute(tei)) {
							console.log(`Error parsing TEIs[${teiIndex.toString()}] with @id: ${tei["@id"]}`);
						} else {
							console.log(`Error parsing TEIs[${teiIndex.toString()}] without @id attribute`);
						}
						console.log(parsedTEI.error);
					}
				});
				parsedItems.push(parsedItem.data);
			} else {
				if (hasIDAttribute(item)) {
					console.log(`Error parsing item ${itemIndex.toString()} with @id: ${item["@id"]}`);
				} else {
					console.log("Error parsing item without @id attribute");
				}
				console.log(parsedItem.error);
			}
		});
		return parsedItems;
	});

	const extractPersons = function (item: TEI, corpusMetadata: TeiHeader | undefined) {
		const corpusPersons = corpusMetadata?.profileDesc?.particDesc?.listPerson;
		const results = [];
		if (corpusPersons && item.teiHeader?.profileDesc?.particDesc?.listPerson) {
			const persons = item.teiHeader.profileDesc.particDesc.listPerson
				.map((item: Person) => {
					return (item["@sameAs"] ?? item.$ ?? "").replace("corpus:", "");
				})
				.filter((item: string | undefined) => item);
			for (const personId of persons) {
				const person = corpusPersons.find((item: Person) => item["@id"] === personId);
				if (person)
					results.push({
						name: person["@id"] ?? "",
						sex: person["@sex"] ?? person.sex?.$ ?? "n/a",
						age: person["@age"] ?? "n/a",
						dob: person.birth?.$ ?? person.birth?.date?.$ ?? "n/a",
					});
			}
		}
		return results;
	};

	const extractMetadata = function (
		item: TEI,
		dataType: string,
		corpusMetadata: TeiHeader | undefined,
	) {
		const dataTypeObject = Object.values(dataTypes).find(
			(dataTypeObject) => dataTypeObject.collection === dataType,
		);
		const resolvedDataType = dataTypeObject ? dataTypeObject.targetType : "Text";
		const h = item.teiHeader;

		// duration
		const duration = h?.fileDesc.sourceDesc.recordingStmt?.recording
			? parseInt(
					h.fileDesc.sourceDesc.recordingStmt.recording["@dur-iso"]
						.replace("PT", "")
						.replace(".0", ""),
				)
			: undefined;
		const durHours = duration ? Math.floor(duration / 3600) : undefined;
		const durSeconds = duration ? Math.floor(duration % 60) : undefined;
		const durMinutes = duration ? Math.floor(((duration % 3600) - durSeconds!) / 60) : undefined;

		// resp
		const persName =
			h?.fileDesc.sourceDesc.recordingStmt?.recording.respStmt?.persName ??
			h?.fileDesc.sourceDesc.recordingStmt?.recording.p?.$ ??
			"Recording record malformed";
		const respPerson = corpusMetadata?.fileDesc.titleStmt.respStmts?.find((resp) => {
			const resp1 = AuthorRefSchema.safeParse(resp.persName).data?.["@ref"];
			const resp2 = AuthorRefSchema.safeParse(persName).data?.["@ref"];
			return resp1 === resp2;
		});
		const respRef = AuthorRefSchema.safeParse(persName);
		const respAuthor = respPerson ? AuthorSchema.safeParse(respPerson.persName).data : undefined;
		const respName =
			respAuthor?.forename && respAuthor.surname
				? `${respAuthor.forename.$} ${respAuthor.surname.$}`
				: (respAuthor?.name?.$ ??
					(respRef.success ? respRef.data["@ref"].replace("corpus:", "") : undefined));

		// place
		const place = h?.profileDesc?.settingDesc?.place;
		let placeSettlement;
		if (place?.placeName?.$) {
			placeSettlement = place.placeName.$;
		} else if (place?.settlement?.name) {
			const placeName = place.settlement.name.find((n) => n["@lang"] === "en");
			if (placeName) placeSettlement = placeName.$;
		}
		const placeName =
			place?.settlement?.name.at(0) ??
			(place?.settlement?.name
				? place.settlement.name.find((n) => n["@lang"] === "en")
				: undefined);
		if (placeName) placeSettlement = placeName.$;

		// responsibilities
		const responsibilityData: Partial<
			Record<Responsibility, Array<{ given: string; family: string }>>
		> = {};
		(
			[
				"author",
				"recording",
				"principal",
				"transcription",
				"transfer to ELAN",
			] as Array<Responsibility>
		).forEach((responsibility) => {
			if (
				h?.fileDesc.titleStmt.respStmts?.find((r) => r.resp.$ === responsibility) &&
				corpusMetadata
			) {
				responsibilityData[responsibility] = h.fileDesc.titleStmt.respStmts
					.filter((r) => responsibility === r.resp.$)
					.map((resp) => {
						const respPerson = corpusMetadata.fileDesc.titleStmt.respStmts?.find(
							(resp2: RespStmt) => {
								const respRef = AuthorRefSchema.safeParse(resp.persName);
								const resp2Ref = AuthorRefSchema.safeParse(resp2.persName);
								return (
									respRef.success &&
									resp2Ref.success &&
									respRef.data["@ref"] === resp2Ref.data["@ref"]
								);
							},
						);
						const author = respPerson
							? AuthorSchema.safeParse(respPerson.persName).data
							: undefined;
						if (author?.forename && author.surname) {
							return { given: author.forename.$, family: author.surname.$ };
						}
						if (author?.name?.$) return { given: author.name.$, family: "" };
						return { family: "", given: "" };
					});
			}
		});

		// publication
		let publication: simpleTEIMetadata["publication"] | undefined;
		if (h?.fileDesc.sourceDesc.biblStruct?.["@type"] === BiblStructType.BookSection) {
			publication = {
				refType: "external",
				type: "chapter",
				bibl: {
					"container-title": h.fileDesc.sourceDesc.biblStruct.monogr?.title?.$,
					title: h.fileDesc.sourceDesc.biblStruct.analytic?.title?.$ ?? "",
					author: [
						{
							given: h.fileDesc.sourceDesc.biblStruct.analytic?.author?.forename?.$ ?? "",
							family: h.fileDesc.sourceDesc.biblStruct.analytic?.author?.surname?.$ ?? "",
						},
					],
					editor: [
						{
							given: h.fileDesc.sourceDesc.biblStruct.monogr?.editor?.forename?.$ ?? "",
							family: h.fileDesc.sourceDesc.biblStruct.monogr?.editor?.surname?.$ ?? "",
						},
					],
					issued: [h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.date.$ ?? ""],
					publisherPlace: h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.pubPlace?.$,
					page: h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.biblScopes?.find(
						(s) => s["@unit"] === Unit.Page,
					)?.$,
				},
			};
		} else if (h?.fileDesc.sourceDesc.biblStruct?.["@type"] === BiblStructType.JournalArticle) {
			publication = {
				refType: "external",
				type: "journalArticle",
				bibl: {
					"container-title": h.fileDesc.sourceDesc.biblStruct.monogr?.title?.$,
					title: h.fileDesc.sourceDesc.biblStruct.analytic?.title?.$ ?? "",
					author: [
						{
							given: h.fileDesc.sourceDesc.biblStruct.analytic?.author?.forename?.$ ?? "",
							family: h.fileDesc.sourceDesc.biblStruct.analytic?.author?.surname?.$ ?? "",
						},
					],
					editor: [
						{
							given: h.fileDesc.sourceDesc.biblStruct.monogr?.editor?.forename?.$ ?? "",
							family: h.fileDesc.sourceDesc.biblStruct.monogr?.editor?.surname?.$ ?? "",
						},
					],
					issued: [h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.date.$ ?? ""],
					publisherPlace: h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.pubPlace?.$,
					volume: h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.biblScopes?.find(
						(s) => s["@unit"] === Unit.Volume,
					)?.$,
					page: h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.biblScopes?.find(
						(s) => s["@unit"] === Unit.Page,
					)?.$,
				},
			};
		} else if (h?.fileDesc.sourceDesc.biblStruct?.["@type"] === BiblStructType.Thesis) {
			publication = {
				refType: "external",
				type: "book",
				bibl: {
					title: h.fileDesc.sourceDesc.biblStruct.monogr?.title?.$ ?? "",
					author: [
						{
							given: h.fileDesc.sourceDesc.biblStruct.monogr?.author?.forename?.$ ?? "",
							family: h.fileDesc.sourceDesc.biblStruct.monogr?.author?.surname?.$ ?? "",
						},
					],
					issued: [h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.date.$ ?? ""],
					publisherPlace: h.fileDesc.sourceDesc.biblStruct.monogr?.imprint.pubPlace?.$,
				},
			};
		}
		const safePublication =
			publication ??
			({
				refType: "external",
				type: "",
				bibl: {
					author: [],
					title: "",
					issued: [],
				},
			} as simpleTEIMetadata["publication"]);

		// category
		let category = "";
		if (resolvedDataType === "CorpusText" && corpusMetadata) {
			const categoryId = h?.profileDesc?.textClass?.catRefs
				? h.profileDesc.textClass.catRefs.at(0)?.["@target"]
				: "";

			const mergedTaxonomies: Taxonomy = {
				categories: [],
			};
			corpusMetadata.encodingDesc?.classDecl?.taxonomies.forEach((t) => {
				mergedTaxonomies.categories = mergedTaxonomies.categories.concat(t.categories);
				return mergedTaxonomies;
			});
			const categoryItem = mergedTaxonomies.categories.find(
				(cat) => cat["@id"] === categoryId?.replace("corpus:", ""),
			);
			if (categoryItem?.catDesc.name) {
				category = categoryItem.catDesc.name.$;
			} else if (categoryItem?.catDesc.$) {
				category = categoryItem.catDesc.$;
			} else {
				category = "Unknown";
			}
		}

		// label/title
		const persons = extractPersons(item, corpusMetadata);
		let label;
		if (!persons.at(0)?.name) {
			label = item["@id"] ?? h?.fileDesc.publicationStmt.idno?.$ ?? "no_id";
		} else if (h?.fileDesc.titleStmt.titles?.at(0)?.$) {
			label = h.fileDesc.titleStmt.titles.at(0)!.$!;
		} else {
			label = placeSettlement;
		}
		if (resolvedDataType === "CorpusText" && h?.fileDesc.titleStmt.titles?.at(0)) {
			label = h.fileDesc.titleStmt.titles[0]!.$!;
		} else if (persons.at(0)) {
			label = persons[0]!.name;
		} else if (h?.fileDesc.titleStmt.titles?.at(0)) {
			label = h.fileDesc.titleStmt.titles[0]!.$;
		}
		const title = h?.fileDesc.titleStmt.titles?.at(0)
			? persons.at(0)?.name
				? `${h.fileDesc.titleStmt.titles[0]!.$} – ${persons.at(0)?.name ?? ""}`
				: h.fileDesc.titleStmt.titles[0]!.$
			: label;
		const safeLabel = label ?? "";
		const safeTitle = title ?? safeLabel;

		const audioAvailability =
			duration && resolvedDataType !== "Feature" && resolvedDataType !== "Profile"
				? (h?.fileDesc.publicationStmt.availability?.["@status"] ?? "unknown")
				: "restricted";

		const parsedItem = SimpleTEIMetadataSchema.safeParse({
			id: item["@id"] ?? h?.fileDesc.publicationStmt.idno?.$ ?? "no_id",
			recordingDate: h?.fileDesc.sourceDesc.recordingStmt?.recording.date
				? h.fileDesc.sourceDesc.recordingStmt.recording.date["@when"]
				: undefined,
			pubDate: h?.fileDesc.publicationStmt.date?.$ ?? "unknown",
			dataType: resolvedDataType,
			label: safeLabel,
			title: safeTitle,
			author: responsibilityData.author ?? [],
			recording: responsibilityData.recording ?? [],
			principal: responsibilityData.principal ?? [],
			transcription: responsibilityData.transcription ?? [],
			"transfer to ELAN": responsibilityData["transfer to ELAN"] ?? [],
			place: {
				settlement: placeSettlement,
				country: place?.country?.$ ?? undefined,
				region: place?.region?.$ ?? undefined,
			},
			person: persons,
			resp:
				resolvedDataType === "CorpusText" &&
				!h?.fileDesc.sourceDesc.recordingStmt?.recording.respStmt
					? "Unknown"
					: (respName ?? ""),
			category,
			duration: duration
				? `${durHours ? `${String(durHours).padStart(2, "0")}:` : ""}${String(durMinutes).padStart(
						2,
						"0",
					)}:${String(durSeconds).padStart(2, "0")}`
				: undefined,
			audioAvailability,
			"@hasTEIw": item["@hasTEIw"] === "true" ? "true" : "false",
			teiHeader: h,
			publication: safePublication,
		});
		if (parsedItem.success) return parsedItem.data;
		else return null;
	};

	const simpleItems: ComputedRef<Array<simpleTEIMetadata>> = computed(() => {
		const corpusMetadata = rawItems.value.find(
			(item) => item.teiHeader && item["@id"] === "vicav_corpus",
		)?.teiHeader;
		const data = rawItems.value
			.map((dataTypeTEIs) => {
				return dataTypeTEIs.TEIs?.map((item) =>
					extractMetadata(item, dataTypeTEIs["@id"] ?? "", corpusMetadata),
				);
			})
			.filter((i) => i !== undefined);

		return (
			([] as Array<simpleTEIMetadata>)
				// @ts-expect-error type inference faulty
				.concat(...data)
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				.filter((item) => item !== null)
		);
	});

	return {
		initialize,
		rawItems,
		simpleItems,
	};
});
