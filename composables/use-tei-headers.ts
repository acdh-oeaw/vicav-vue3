import { computed } from "vue";

import type {
	PersName,
	Person,
	Responsibility,
	RespStmt,
	simpleTEIMetadata,
	Taxonomy,
	TEI,
	TeiCorpus,
	TeiHeader,
	TeiTypedTarget,
} from "@/types/teiCorpus";

import dataTypes from "../config/dataTypes";

type RawTEIItems = ComputedRef<Array<TeiCorpus | object>>;

const extractPersons = function (item: TEI, corpusMetadata: TeiHeader | undefined) {
	const corpusPersons = corpusMetadata?.profileDesc?.particDesc?.listPerson;
	const results = [];
	if (corpusPersons && item.teiHeader.profileDesc?.particDesc?.listPerson) {
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
	const place = item.teiHeader.profileDesc?.settingDesc?.place;
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

	template.id = item["@id"] ?? item.teiHeader.fileDesc.publicationStmt.idno?.$ ?? "no_id";

	if (item.teiHeader.fileDesc.sourceDesc.recordingStmt?.recording.date)
		template.recordingDate =
			item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.date["@when"];
	template.pubDate = item.teiHeader.fileDesc.publicationStmt.date?.$ ?? "unknown";
	const dataTypeObject = Object.values(dataTypes).find(
		(dataTypeObject) => dataTypeObject.collection === dataType,
	);
	if (dataTypeObject) template.dataType = dataTypeObject.targetType;
	if (place) {
		if (place.placeName) {
			template.place.settlement = place.placeName.$;
		} else if (place.settlement?.name) {
			const placeName = place.settlement.name.find((n) => n["@lang"] === "en");
			if (placeName) template.place.settlement = placeName.$;
		}

		let placeName;
		if (place.settlement?.name?.at(0)) {
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

	if (item.teiHeader.fileDesc.sourceDesc.recordingStmt?.recording) {
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
			template.audioAvailability = item.teiHeader.fileDesc.publicationStmt.availability["@status"];
		}
	}

	if (
		template.dataType === "CorpusText" &&
		item.teiHeader.fileDesc.sourceDesc.recordingStmt?.recording.respStmt?.persName &&
		corpusMetadata
	) {
		const persName = item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.respStmt
			.persName as TeiTypedTarget;

		const respPerson = corpusMetadata.fileDesc.titleStmt.respStmts?.find((resp: RespStmt) => {
			if (resp.persName && isPersName(resp.persName)) {
				return resp.persName["@ref"] === persName["@ref"];
			} else {
				return false;
			}
		});
		let name;
		if (respPerson?.persName) {
			const persName2 = respPerson.persName as PersName;
			name =
				persName2.forename && persName2.surname
					? `${persName2.forename.$} ${persName2.surname.$}`
					: persName2.$;
		} else {
			name = (persName["@ref"] ?? "missing persName").replace("corpus:", "");
		}
		if (name) template.resp = name;
	} else if (
		template.dataType === "CorpusText" &&
		!item.teiHeader.fileDesc.sourceDesc.recordingStmt?.recording.respStmt
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
			item.teiHeader.fileDesc.titleStmt.respStmts?.find((r) => r.resp.$ === responsibility) &&
			corpusMetadata
		) {
			template[responsibility as keyof simpleTEIMetadata] =
				item.teiHeader.fileDesc.titleStmt.respStmts
					.filter((r) => responsibility === r.resp.$)
					.map((resp) => {
						const respPerson = corpusMetadata.fileDesc.titleStmt.respStmts?.find(
							(resp2: RespStmt) => {
								if (resp2.persName) {
									return resp.persName!["@ref"] === resp2.persName["@ref"];
								} else {
									return false;
								}
							},
						);

						if (respPerson?.persName && isPersName(respPerson.persName)) {
							const persName = respPerson.persName;
							if (persName.forename && persName.surname) {
								return {
									given: persName.forename.$,
									family: persName.surname.$,
								};
							} else {
								return {
									given: persName.$,
									family: "",
								};
							}
						}
						return { family: "", given: "" };
					});
		}
	});

	if (item.teiHeader.fileDesc.sourceDesc.biblStruct?.["@type"] === "bookSection") {
		template.publication = {
			refType: "external",
			type: "chapter",
			bibl: {
				"container-title": item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.title?.$,
				title: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.title.$ ?? "",
				author: [
					{
						given: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author.forename?.$ ?? "",
						family: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author.surname?.$ ?? "",
					},
				],
				editor: [
					{
						given: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.forename?.$ ?? "",
						family: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.surname?.$ ?? "",
					},
				],
				issued: [item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.date.$ ?? ""],
				publisherPlace: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.pubPlace?.$,
				page: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.biblScopes.find(
					(s) => s["@unit"] === "page",
				)?.$,
			},
		};
	} else if (item.teiHeader.fileDesc.sourceDesc.biblStruct?.["@type"] === "journalArticle") {
		template.publication = {
			refType: "external",
			type: "journalArticle",
			bibl: {
				"container-title": item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.title?.$,
				title: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.title.$ ?? "",
				author: [
					{
						given: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author.forename?.$ ?? "",
						family: item.teiHeader.fileDesc.sourceDesc.biblStruct.analytic?.author.surname?.$ ?? "",
					},
				],
				editor: [
					{
						given: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.forename?.$ ?? "",
						family: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.editor?.surname?.$ ?? "",
					},
				],
				issued: [item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.date.$ ?? ""],
				publisherPlace: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.pubPlace?.$,
				volume: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.biblScopes.find(
					(s) => s["@unit"] === "volume",
				)?.$,
				page: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.biblScopes.find(
					(s) => s["@unit"] === "page",
				)?.$,
			},
		};
	} else if (item.teiHeader.fileDesc.sourceDesc.biblStruct?.["@type"] === "thesis") {
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
				issued: [item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.date.$ ?? ""],
				publisherPlace: item.teiHeader.fileDesc.sourceDesc.biblStruct.monogr.imprint?.pubPlace?.$,
			},
		};
	}

	template.person = extractPersons(item, corpusMetadata);
	if (template.dataType === "CorpusText" && corpusMetadata) {
		const categoryId = item.teiHeader.profileDesc?.textClass?.catRefs
			? item.teiHeader.profileDesc.textClass.catRefs[0]!["@target"]
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
	} else if (item.teiHeader.fileDesc.titleStmt.titles?.at(0)?.$) {
		template.label = item.teiHeader.fileDesc.titleStmt.titles.at(0)!.$!;
	} else {
		template.label = template.place.settlement;
	}
	if (template.dataType === "CorpusText" && item.teiHeader.fileDesc.titleStmt.titles?.at(0)) {
		template.label = item.teiHeader.fileDesc.titleStmt.titles[0]!.$!;
	} else {
		if (template.person.at(0)) {
			template.label = template.person[0]!.name;
		} else {
			template.label = item.teiHeader.fileDesc.titleStmt.titles?.at(0)
				? item.teiHeader.fileDesc.titleStmt.titles[0]!.$!
				: template.place.settlement;
		}
	}
	template.title = item.teiHeader.fileDesc.titleStmt.titles?.at(0)
		? template.person.at(0)?.name
			? `${item.teiHeader.fileDesc.titleStmt.titles[0]!.$!} – ${template.person.at(0)?.name ?? ""}`
			: item.teiHeader.fileDesc.titleStmt.titles[0]!.$!
		: template.label;

	template["@hasTEIw"] = item["@hasTEIw"] === "true" ? "true" : "false";
	return template;
};

// Google Gemini Cloude Code suggestion
function isTEIs(item: TeiCorpus | object): item is TeiCorpus {
	return Object.hasOwn(item, "TEIs");
}

function isPersName(item: PersName | object): item is PersName {
	return Object.hasOwn(item, "@ref");
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
				return dataTypeTEIs.TEIs.map((item) =>
					extractMetadata(item, dataTypeTEIs["@id"], corpusMetadata),
				);
			});
		return ([] as Array<simpleTEIMetadata>).concat(...data);
	});

	return {
		rawItems,
		simpleItems,
	};
}
