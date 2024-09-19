import { computed } from "vue";

import type {
	PersName,
	Person,
	RespStmt,
	Settlement,
	simpleTEIMetadata,
	TEI,
	TeiCorpus,
	TeiHeader,
	TeiTypedTarget,
} from "@/types/global";

import dataTypes from "../config/dataTypes";

type RawTEIItems = ComputedRef<Array<TEIs | object>>;

interface teiStringNode {
	$: string;
}

interface teiPerson {
	"@sameAs"?: string;
	"@id"?: string;
	"@sex": string;
	"@age": string;
	$: string;
}

interface teiHeader {
	"@id": string;
	teiHeader: {
		fileDesc: {
			titleStmt: {
				titles?: Array<teiStringNode>;
				respStmts: Array<RespStmt>;
			};
			publicationStmt: { idno?: teiStringNode };
		};
		profileDesc?: {
			taxonomy?: { category: { "@id": string; $: string } };
			particDesc?: {
				person?: teiPerson;
				listPerson?: Array<teiPerson>;
			};
			settingDesc?: {
				place: {
					placeName?: teiStringNode;
					settlement?: { name?: Array<Settlement>; placeName?: teiStringNode };
					region?: teiStringNode;
					country?: teiStringNode;
					location?: { geo: teiStringNode };
				};
			};
			textClass?: {
				catRef: {
					"@target": string;
				};
			};
		};
	};
	"@hasTEIw": string;
}

interface TEIs {
	"@id": string;
	teiHeader?: teiHeader;
	TEIs: Array<teiHeader>;
}

const extractMetadata = function (
	item: TEI,
	dataType: string,
	corpusMetadata: TeiHeader | undefined,
) {
	const place = item.teiHeader.profileDesc?.settingDesc?.place;
	const template = {
		id: "",
		place: {
			settlement: "",
			region: "",
			country: "",
		},
		person: {
			name: "",
			age: "",
			sex: "",
		},
		resp: "",
		dataType: "Text",
		secondaryDataType: "",
		label: "",
		hasTEIw: false,
		teiHeader: item.teiHeader,
	} as simpleTEIMetadata;
	template.id = item["@id"]
		? item["@id"]
		: item.teiHeader.fileDesc.publicationStmt.idno?.$
			? item.teiHeader.fileDesc.publicationStmt.idno.$
			: "no_id";
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
		if (place.region) {
			placeName = place.region;
		} else if (place.settlement?.name?.at(0)) {
			placeName = place.settlement.name.at(0);
		} else if (place.settlement?.name) {
			placeName = place.settlement.name.find((n) => n["@lang"] === "en");
		}
		if (placeName) template.place.settlement = placeName.$;

		if (place.country) {
			template.place.country = place.country.$;
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
					: persName2["@full"];
		} else {
			name = monogram;
		}
		if (name) template.resp = name;
	}

	if (template.dataType === "CorpusText" && corpusMetadata) {
		const corpusPersons = corpusMetadata.profileDesc?.particDesc?.listPerson;
		if (corpusPersons && item.teiHeader.profileDesc?.particDesc?.listPerson) {
			const persons = item.teiHeader.profileDesc.particDesc.listPerson
				.map((item: Person) => {
					if (!item["@sameAs"]) return;
					return item["@sameAs"].replace("corpus:", "");
				})
				.filter((item: string | undefined) => item);

			const person = corpusPersons.find((item: Person) => item["@id"] === persons[0]);
			if (person) {
				if (person["@id"]) template.person.name = person["@id"];
				if (person["@sex"]) {
					template.person.sex = person["@sex"];
				}
				if (person["@age"]) {
					template.person.age = person["@age"];
				}
			}
		}

		const subtype = item.teiHeader.profileDesc?.textClass?.catRef
			? item.teiHeader.profileDesc.textClass.catRef["@target"]
			: "";
		switch (subtype) {
			case "corpus:textClass.ST":
				template.secondaryDataType = "Sample Text";
				break;
			case "corpus:textClass.FL":
				template.secondaryDataType = "Feature List";
				break;
			case "corpus:textClass.FS":
				template.secondaryDataType = "Free Speech";
				break;
			case "corpus:textClass.TUN":
				template.secondaryDataType = "Tunocent Questionnaire";
				break;
			case "corpus:textClass.WAD":
				template.secondaryDataType = "WAD Questionnaire";
				break;
			default:
				break;
		}
	} else {
		const person = item.teiHeader.profileDesc?.particDesc?.person;
		if (person?.$) {
			template.person.name = person.$;
			if (person["@sex"]) {
				template.person.sex = person["@sex"];
			}
			if (person["@age"]) {
				template.person.age = person["@age"];
			}
		}
	}
	if (template.person.name) {
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
		template.label = template.person.name
			? template.person.name
			: item.teiHeader.fileDesc.titleStmt.titles?.at(0)
				? item.teiHeader.fileDesc.titleStmt.titles[0]!.$!
				: template.place.settlement;
	}

	template.hasTEIw = item["@hasTEIw"] === "true";
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
