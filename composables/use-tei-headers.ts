import { computed } from "vue";

import type { simpleTEIMetadata } from "@/types/global";

import dataTypes from "../config/dataTypes";

interface teiSettlement {
	"@lang": string;
	$: string;
}

interface teiStringNode {
	$: string;
}

interface teiPersName {
	"@id": string;
	"@full"?: string;
	$?: string;
	"@forename"?: string;
	"@surname"?: string;
}
interface teiPersNameRef {
	"@ref": string;
}

interface RespStmt {
	persName?: teiPersName | teiPersNameRef;
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
					settlement?: { name?: Array<teiSettlement>; placeName?: teiStringNode };
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

type RawTEIItems = ComputedRef<Array<TEIs | object>>;

const extractMetadata = function (item: teiHeader, dataType: string, corpusRaw: teiHeader) {
	const place = item.teiHeader.profileDesc?.settingDesc?.place;
	const corpusMetadata = corpusRaw.teiHeader;
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
		dataType: "",
		secondaryDataType: "",
		label: "",
		hasTEIw: false,
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

	let placeName;
	if (place?.placeName) {
		placeName = place.placeName;
	} else if (place?.settlement?.placeName) {
		placeName = place.settlement.placeName;
	} else if (place?.settlement?.name) {
		placeName = place.settlement.name.find((n) => n["@lang"] === "en");
	}
	if (placeName) template.place.settlement = placeName.$;

	if (place?.region) {
		template.place.region = place.region.$;
	}

	if (place?.country) {
		template.place.country = place.country.$;
	}

	if (
		template.dataType === "CorpusText" &&
		item.teiHeader.fileDesc.titleStmt.respStmts[0]?.persName
	) {
		const persName = item.teiHeader.fileDesc.titleStmt.respStmts[0]?.persName as teiPersNameRef;
		const monogram = persName["@ref"].replace("corpus:", "");
		const respPerson = corpusMetadata.fileDesc.titleStmt.respStmts.find((resp: RespStmt) => {
			const persName = resp.persName as teiPersName;
			return persName["@id"] === monogram;
		});

		let name;
		if (respPerson) {
			const persName2 = respPerson.persName as teiPersName;
			name = persName2["@forename"]
				? `${persName2["@forename"]} ${persName2["@surname"]}`
				: persName2["@full"];
		} else {
			name = monogram;
		}
		if (name) template.resp = name;
	}

	if (template.dataType === "CorpusText") {
		const corpusPersons = corpusMetadata.profileDesc?.particDesc?.listPerson;
		if (corpusPersons && item.teiHeader.profileDesc?.particDesc?.listPerson) {
			const persons = item.teiHeader.profileDesc.particDesc.listPerson
				.map((item: teiPerson) => {
					if (!item["@sameAs"]) return;
					return item["@sameAs"].replace("corpus:", "");
				})
				.filter((item: string | undefined) => item);

			const person = corpusPersons.find((item: teiPerson) => item["@id"] === persons[0]);
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
		}
	} else {
		const person = item.teiHeader.profileDesc?.particDesc?.person;
		if (person) {
			template.person.name = person.$;
			if (person["@sex"]) {
				template.person.sex = person["@sex"];
			}
			if (person["@age"]) {
				template.person.age = person["@age"];
			}
		}
	}

	if (template.dataType === "CorpusText") {
		template.label = item.teiHeader.fileDesc.titleStmt.titles[0].$;
	} else {
		template.label = template.person.name
			? template.person.name
			: item.teiHeader.fileDesc.titleStmt.titles
				? item.teiHeader.fileDesc.titleStmt.titles[0].$
				: template.place.settlement;
	}

	template.hasTEIw = item["@hasTEIw"] === "true";
	return template;
};

// Google Gemini Cloude Code suggestion
function isTEIs(item: TEIs | object): item is TEIs {
	return Object.prototype.hasOwnProperty.call(item, "TEIs");
}

export function useTEIHeaders() {
	const { data: projectData } = useProjectInfo();

	const rawItems: RawTEIItems = computed(() => {
		return (
			projectData.value?.projectConfig?.staticData?.table
				? projectData.value.projectConfig.staticData.table
				: []
		) as Array<TEIs>;
	});

	const simpleItems: ComputedRef<Array<simpleTEIMetadata>> = computed(() => {
		const corpusMetadata = rawItems.value
			.filter(isTEIs)
			.find((item: TEIs) => item.teiHeader && item["@id"] === "vicav_corpus");
		const data = rawItems.value
			// Google Gemini Cloude Code suggestion
			.filter(isTEIs)
			.map((dataTypeTEIs: TEIs) => {
				return dataTypeTEIs.TEIs.map((item: teiHeader) =>
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
