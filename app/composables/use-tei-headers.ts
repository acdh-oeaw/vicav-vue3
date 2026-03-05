import { computed } from "vue";

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
} from "@/lib/api-client/index.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus";

import dataTypes from "../config/dataTypes.ts";

type RawTEIItems = ComputedRef<Array<TeiCorpus | object>>;

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
					sex: person["@sex"] ?? "",
					age: person["@age"] ?? "",
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
	const place = item.teiHeader?.profileDesc?.settingDesc?.place;
	const template = {
		id: "",
		recordingDate: "",
		audioAvailability: "restricted",
		duration: "",
		pubDate: "",
		place: {
			settlement: "",
			region: "",
			country: "",
		},
		person: [
			{
				name: "",
				age: "",
				sex: "",
			},
		],
		resp: "",
		dataType: "Text",
		category: "",
		label: "",
		"@hasTEIw": "false",
		teiHeader: item.teiHeader,
	} as simpleTEIMetadata;

	template.id = item["@id"] ?? item.teiHeader?.fileDesc.publicationStmt.idno?.$ ?? "no_id";

	if (item.teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording.date)
		template.recordingDate =
			item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.date["@when"];
	template.pubDate = item.teiHeader?.fileDesc.publicationStmt.date?.$ ?? "unknown";
	const dataTypeObject = Object.values(dataTypes).find(
		(dataTypeObject) => dataTypeObject.collection === dataType,
	);
	if (dataTypeObject) template.dataType = dataTypeObject.targetType;
	if (place) {
		if (place.placeName) {
			if ("$" in place.placeName && place.placeName.$) {
				template.place.settlement = place.placeName.$;
			}
		} else if (place.settlement?.name) {
			const placeName = place.settlement.name.find((n) => n["@lang"] === "en");
			if (placeName) template.place.settlement = placeName.$;
		}

		let placeName;
		if (place.settlement?.name.at(0)) {
			placeName = place.settlement.name.at(0);
		} else if (place.settlement?.name) {
			placeName = place.settlement.name.find((n) => n["@lang"] === "en");
		}
		if (placeName) template.place.settlement = placeName.$;

		if (place.country) {
			template.place.country = place.country.$;
		}

		if (place.region) {
			template.place.region = place.region.$;
		}
	}

	if (item.teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording) {
		const duration = parseInt(
			item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording["@dur-iso"]
				.replace("PT", "")
				.replace(".0", ""),
		);
		const durHours = Math.floor(duration / 3600);
		const durSeconds = Math.floor(duration % 60);
		const durMinutes = Math.floor(((duration % 3600) - durSeconds) / 60);
		template.duration = `${
			durHours ? `${String(durHours).padStart(2, "0")}:` : ""
		}${String(durMinutes).padStart(2, "0")}:${String(durSeconds).padStart(2, "0")}`;
		if (template.dataType !== "Feature" && template.dataType !== "Profile") {
			template.audioAvailability =
				item.teiHeader.fileDesc.publicationStmt.availability?.["@status"] ?? "unknown";
		}
	}

	if (
		template.dataType === "CorpusText" &&
		item.teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording.respStmt.persName &&
		corpusMetadata
	) {
		const persName = item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.respStmt.persName;

		const respPerson = corpusMetadata.fileDesc.titleStmt.respStmts?.find((resp) => {
			if (resp.persName && isAuthorRef(resp.persName) && isAuthorRef(persName)) {
				return resp.persName["@ref"] === persName["@ref"];
			} else {
				return false;
			}
		});
		let name;
		if (respPerson?.persName && isAuthor(respPerson.persName)) {
			const persName2 = respPerson.persName;
			name =
				persName2.forename && persName2.surname
					? `${persName2.forename.$} ${persName2.surname.$}`
					: (persName2.name?.$ ?? "unknown");
		} else if (isAuthorRef(persName)) {
			name = persName["@ref"].replace("corpus:", "");
		}
		if (name) template.resp = name;
	} else if (
		template.dataType === "CorpusText" &&
		!item.teiHeader?.fileDesc.sourceDesc.recordingStmt?.recording.respStmt
	) {
		template.resp = "Unknown";
	}

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
			item.teiHeader?.fileDesc.titleStmt.respStmts?.find((r) => r.resp.$ === responsibility) &&
			corpusMetadata
		) {
			template[responsibility as keyof simpleTEIMetadata] =
				item.teiHeader.fileDesc.titleStmt.respStmts
					.filter((r) => responsibility === r.resp.$)
					.map((resp) => {
						const respPerson = corpusMetadata.fileDesc.titleStmt.respStmts?.find(
							(resp2: RespStmt) => {
								if (
									resp2.persName &&
									isAuthorRef(resp2.persName) &&
									resp.persName &&
									isAuthorRef(resp.persName)
								) {
									return resp.persName["@ref"] === resp2.persName["@ref"];
								} else {
									return false;
								}
							},
						);

						if (respPerson?.persName && isAuthor(respPerson.persName)) {
							const persName = respPerson.persName;
							if (persName.forename && persName.surname) {
								return {
									given: persName.forename.$,
									family: persName.surname.$,
								};
							} else {
								return {
									given: persName.name?.$ ?? "unknown",
									family: "",
								};
							}
						}
						return { family: "", given: "" };
					});
		}
	});

	if (item.teiHeader?.fileDesc.sourceDesc.biblStruct?.["@type"] === BiblStructType.BookSection) {
		template.publication = {
			refType: "external",
			type: "chapter",
			bibl: {
				"container-title": item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.title?.$,
				title: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.title?.$ ?? "",
				author: [
					{
						given:
							item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author?.forename?.$ ?? "",
						family:
							item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author?.surname?.$ ?? "",
					},
				],
				editor: [
					{
						given: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.forename?.$ ?? "",
						family: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.surname?.$ ?? "",
					},
				],
				issued: [item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.date.$],
				publisherPlace: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.pubPlace?.$,
				page: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.biblScopes?.find(
					(s) => s["@unit"] === Unit.Page,
				)?.$,
			},
		};
	} else if (
		item.teiHeader?.fileDesc.sourceDesc.biblStruct?.["@type"] === BiblStructType.JournalArticle
	) {
		template.publication = {
			refType: "external",
			type: "journalArticle",
			bibl: {
				"container-title": item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.title?.$,
				title: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.title?.$ ?? "",
				author: [
					{
						given:
							item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author?.forename?.$ ?? "",
						family:
							item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author?.surname?.$ ?? "",
					},
				],
				editor: [
					{
						given: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.forename?.$ ?? "",
						family: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.surname?.$ ?? "",
					},
				],
				issued: [item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.date.$],
				publisherPlace: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.pubPlace?.$,
				volume: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.biblScopes?.find(
					(s) => s["@unit"] === Unit.Volume,
				)?.$,
				page: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.biblScopes?.find(
					(s) => s["@unit"] === Unit.Page,
				)?.$,
			},
		};
	} else if (item.teiHeader?.fileDesc.sourceDesc.biblStruct?.["@type"] === BiblStructType.Thesis) {
		template.publication = {
			refType: "external",
			type: "book",
			bibl: {
				title: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.title?.$ ?? "",
				author: [
					{
						given: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.author?.forename?.$ ?? "",
						family: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.author?.surname?.$ ?? "",
					},
				],
				issued: [item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.date.$],
				publisherPlace: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint.pubPlace?.$,
			},
		};
	}

	template.person = extractPersons(item, corpusMetadata);
	if (template.dataType === "CorpusText" && corpusMetadata) {
		const categoryId = item.teiHeader?.profileDesc?.textClass?.catRefs
			? item.teiHeader.profileDesc.textClass.catRefs.at(0)?.["@target"]
			: "";

		const mergedTaxonomies: Taxonomy = {
			categories: [],
		};
		corpusMetadata.encodingDesc?.classDecl?.taxonomies.forEach((t) => {
			mergedTaxonomies.categories = mergedTaxonomies.categories.concat(t.categories);
			return mergedTaxonomies;
		});
		const category = mergedTaxonomies.categories.find(
			(cat) => cat["@id"] === categoryId?.replace("corpus:", ""),
		);
		if (category?.catDesc.name) {
			template.category = category.catDesc.name.$;
		} else if (category?.catDesc.$) {
			template.category = category.catDesc.$;
		} else {
			template.category = "Unknown";
		}
	}

	if (!template.person.at(0)?.name) {
		// this is true only for SHAWI data, needs to be checked in the future.
		template.label = template.id;
	} else if (item.teiHeader?.fileDesc.titleStmt.titles?.at(0)?.$) {
		template.label = item.teiHeader.fileDesc.titleStmt.titles.at(0)!.$!;
	} else {
		template.label = template.place.settlement;
	}
	if (template.dataType === "CorpusText" && item.teiHeader?.fileDesc.titleStmt.titles?.at(0)) {
		template.label = item.teiHeader.fileDesc.titleStmt.titles[0]!.$!;
	} else {
		if (template.person.at(0)) {
			template.label = template.person[0]!.name;
		} else {
			template.label = item.teiHeader?.fileDesc.titleStmt.titles?.at(0)
				? item.teiHeader.fileDesc.titleStmt.titles[0]!.$
				: template.place.settlement;
		}
	}
	template.title = item.teiHeader?.fileDesc.titleStmt.titles?.at(0)
		? template.person.at(0)?.name
			? `${item.teiHeader.fileDesc.titleStmt.titles[0]!.$} – ${template.person.at(0)?.name ?? ""}`
			: item.teiHeader.fileDesc.titleStmt.titles[0]!.$
		: template.label;

	template["@hasTEIw"] = item["@hasTEIw"] === "true" ? "true" : "false";
	return template;
};

// Google Gemini Cloude Code suggestion

function isTEIs(item: TeiCorpus | object): item is TeiCorpus {
	return Object.hasOwn(item, "TEIs");
}

// TODO add check for undefined?
function isAuthorRef(item: AuthorRef | object): item is AuthorRef {
	return Object.hasOwn(item, "@ref");
}

// TODO add check for undefined?
function isAuthor(item: Author | object): item is Author {
	return (
		Object.hasOwn(item, "@id") ||
		Object.hasOwn(item, "forename") ||
		Object.hasOwn(item, "surname") ||
		Object.hasOwn(item, "name")
	);
}

export function useTEIHeaders() {
	const { data: projectData } = useProjectInfo();

	const rawItems: RawTEIItems = computed(() => {
		return (projectData.value?.projectConfig?.staticData?.table ?? []).filter(isTEIs);
	});

	const simpleItems: ComputedRef<Array<simpleTEIMetadata>> = computed(() => {
		const corpusMetadata = rawItems.value
			.filter(isTEIs)
			.find((item) => item.teiHeader && item["@id"] === "vicav_corpus")?.teiHeader;
		const data = rawItems.value
			.filter(isTEIs)
			// Google Gemini Cloude Code suggestion
			.map((dataTypeTEIs) => {
				return dataTypeTEIs.TEIs?.map((item) =>
					extractMetadata(item, dataTypeTEIs["@id"] ?? "", corpusMetadata),
				);
			})
			.filter((i) => i !== undefined);
		return ([] as Array<simpleTEIMetadata>).concat(...data);
	});

	return {
		rawItems,
		simpleItems,
	};
}
