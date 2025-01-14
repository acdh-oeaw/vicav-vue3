import { computed } from "vue";

import type {
	PersName,
	Person,
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
	template.id = item["@id"]
		? item["@id"]
		: item.teiHeader.fileDesc.publicationStmt.idno?.$
			? item.teiHeader.fileDesc.publicationStmt.idno.$
			: "no_id";

	if (item.teiHeader.fileDesc.sourceDesc.recordingStmt?.recording.date)
		template.recordingDate =
			item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.date["@when"];
	template.pubDate = item.teiHeader.fileDesc.publicationStmt.date.$ ?? "unknown";
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
	if (
		template.dataType === "CorpusText" &&
		item.teiHeader.fileDesc.titleStmt.respStmts?.at(0)?.persName &&
		corpusMetadata
	) {
		const persName = item.teiHeader.fileDesc.titleStmt.respStmts[0]?.persName as TeiTypedTarget;
		const monogram = (persName["@ref"] ?? "missing persName").replace("corpus:", "");
		const respPerson = corpusMetadata.fileDesc.titleStmt.respStmts?.find((resp: RespStmt) => {
			if (resp.persName && isPersName(resp.persName)) {
				const persName = resp.persName;
				return persName["@id"] === monogram;
			} else {
				return false;
			}
		});

		let name;
		if (respPerson?.persName) {
			const persName2 = respPerson.persName as PersName;
			name =
				persName2["@forename"] && persName2["@surname"]
					? `${persName2["@forename"]} ${persName2["@surname"]}`
					: persName2.$;
		} else {
			name = monogram;
		}
		if (name) template.resp = name;
	}

	template.person = extractPersons(item, corpusMetadata);
	if (template.dataType === "CorpusText" && corpusMetadata) {
		const categoryId = item.teiHeader.profileDesc?.textClass?.catRef
			? item.teiHeader.profileDesc.textClass.catRef["@target"]
			: "";

		const mergedTaxonomies: Taxonomy = {
			categories: [],
		};
		corpusMetadata.encodingDesc.classDecl?.taxonomies.forEach((t) => {
			mergedTaxonomies.categories = mergedTaxonomies.categories?.concat(t.categories!);
			return mergedTaxonomies;
		});
		const category = mergedTaxonomies.categories?.find(
			(cat) => cat["@id"] === categoryId?.replace("corpus:", ""),
		);

		template.category = category!.catDesc.name.$;
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

	template["@hasTEIw"] = item["@hasTEIw"] === "true" ? "true" : "false";
	return template;
};

// Google Gemini Cloude Code suggestion
function isTEIs(item: TeiCorpus | object): item is TeiCorpus {
	return Object.hasOwn(item, "TEIs");
}

function isPersName(item: PersName | object): item is PersName {
	return Object.hasOwn(item, "@id");
}

export function useTEIHeaders() {
	const { data: projectData } = useProjectInfo();

	const rawItems: RawTEIItems = computed(() => {
		return (
			projectData.value?.projectConfig?.staticData?.table
				? projectData.value.projectConfig.staticData.table
				: []
		).filter(isTEIs);
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
